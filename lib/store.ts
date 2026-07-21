import "server-only";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { get, list, put } from "@vercel/blob";
import { appConfig } from "./config";
import type { Coupon } from "./types";

/**
 * Storage layer.
 *
 * Production: a single encrypted blob in Vercel Blob storage. Blob URLs are
 * public, so the coupon data (which contains customer names + WhatsApp numbers)
 * is encrypted with AES-256-GCM before upload. Reads use a cache-busting query
 * so an overwrite is immediately visible (read-after-write consistency).
 *
 * Local dev (no BLOB_READ_WRITE_TOKEN): falls back to a gitignored .data file
 * so the app runs without any external service.
 */

const DB_PATHNAME = "coupons/db.enc";
const LOCAL_PATH = path.join(process.cwd(), ".data", "coupons.json");

/**
 * Collect every Vercel Blob read-write token present in the environment.
 *
 * Vercel Blob tokens always start with "vercel_blob_rw_". A project can end up
 * with several of them (e.g. a leftover token from a deleted store plus the new
 * one). We gather them all so the store can pick whichever one still points to a
 * live store — see resolveWorkingToken(). The canonical BLOB_READ_WRITE_TOKEN,
 * if present, is tried first.
 */
function candidateBlobTokens(): string[] {
  const tokens = new Set<string>();
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    tokens.add(process.env.BLOB_READ_WRITE_TOKEN);
  }
  for (const value of Object.values(process.env)) {
    if (typeof value === "string" && value.startsWith("vercel_blob_rw_")) {
      tokens.add(value);
    }
  }
  return [...tokens];
}

const useBlob = candidateBlobTokens().length > 0;

// Cache the token that actually works so we don't re-probe on every request.
let workingToken: string | null = null;

/** Errors that mean "this token/store is unusable, try the next token". */
function isDeadStoreError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    msg.includes("does not exist") ||
    msg.includes("not found") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("invalid token") ||
    msg.includes("no longer exists")
  );
}

/**
 * Find a Blob token whose store still exists by probing each candidate with a
 * cheap list() call. Skips tokens for deleted stores (the exact "This store does
 * not exist" failure we hit after a store is recreated).
 */
async function resolveWorkingToken(): Promise<string> {
  if (workingToken) return workingToken;

  const candidates = candidateBlobTokens();
  if (candidates.length === 0) {
    throw new Error(
      "No Vercel Blob token found. Connect a Blob store to this project and redeploy."
    );
  }

  let lastError: unknown = null;
  for (const token of candidates) {
    try {
      await list({ prefix: DB_PATHNAME, limit: 1, token });
      workingToken = token;
      return token;
    } catch (err) {
      lastError = err;
      if (isDeadStoreError(err)) continue; // stale/dead token — try the next one
      throw err; // a different failure (e.g. network) — surface it
    }
  }

  throw new Error(
    "No connected Vercel Blob store is reachable — every token in the environment points to a deleted store. Connect the current Blob store to this project (and remove old ones), then redeploy."
  );
}

type BlobAccess = "public" | "private";

// A Blob store is configured as either "public" or "private", and reads/writes
// must use the matching access mode. We don't know which it is up front, so we
// try one, and on the specific "wrong access mode" error we flip and remember
// the correct one for the life of this serverless instance.
let cachedAccess: BlobAccess | null = null;

function accessOrder(): BlobAccess[] {
  if (cachedAccess) return [cachedAccess];
  const forced = process.env.BLOB_ACCESS;
  if (forced === "public" || forced === "private") return [forced];
  // Newer Blob stores default to private, so try that first.
  return ["private", "public"];
}

function isAccessMismatch(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    msg.includes("public access on a private store") ||
    msg.includes("private access on a public store") ||
    (msg.includes("access") && msg.includes("store") && msg.includes("configured"))
  );
}

function isNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return msg.includes("not found") || msg.includes("does not exist");
}

function encryptionKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update(`${appConfig.dataEncryptionKey}:salkara-coupons-v1`)
    .digest();
}

function encrypt(plain: string): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: iv(12) | authTag(16) | ciphertext
  return Buffer.concat([iv, tag, enc]);
}

function decrypt(buf: Buffer): string {
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

async function readAll(): Promise<Coupon[]> {
  if (!useBlob) {
    try {
      const raw = await fs.readFile(LOCAL_PATH, "utf8");
      return JSON.parse(raw) as Coupon[];
    } catch {
      return [];
    }
  }

  const token = await resolveWorkingToken();

  // Read the encrypted blob directly with get() — works for both public and
  // private stores. useCache:false reads the latest content (read-after-write
  // consistency). Tries each access mode until the store's mode matches.
  let lastError: unknown = null;
  for (const access of accessOrder()) {
    try {
      const result = await get(DB_PATHNAME, { access, token, useCache: false });
      cachedAccess = access;
      if (!result || !result.stream) return [];
      const buf = Buffer.from(await new Response(result.stream).arrayBuffer());
      try {
        return JSON.parse(decrypt(buf)) as Coupon[];
      } catch {
        return [];
      }
    } catch (err) {
      lastError = err;
      if (isAccessMismatch(err)) continue; // wrong access mode — try the other
      if (isNotFound(err)) return []; // no data yet
      throw err;
    }
  }
  throw lastError;
}

async function writeAll(coupons: Coupon[]): Promise<void> {
  const json = JSON.stringify(coupons);
  if (!useBlob) {
    // On Vercel the filesystem is read-only, so local-file mode can't work.
    // Give a clear, actionable error instead of a cryptic EROFS failure.
    if (process.env.VERCEL) {
      throw new Error(
        "Vercel Blob storage is not connected. Add a Blob store to this project and redeploy (the app needs a token starting with 'vercel_blob_rw_')."
      );
    }
    await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
    await fs.writeFile(LOCAL_PATH, json, "utf8");
    return;
  }

  const token = await resolveWorkingToken();
  const body = encrypt(json);

  // Write with the store's access mode, adapting automatically if we guessed
  // wrong (public vs private) and caching the correct mode afterwards.
  let lastError: unknown = null;
  for (const access of accessOrder()) {
    try {
      await put(DB_PATHNAME, body, {
        access,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/octet-stream",
        cacheControlMaxAge: 0,
        token,
      });
      cachedAccess = access;
      return;
    } catch (err) {
      lastError = err;
      if (isAccessMismatch(err)) continue; // wrong access mode — try the other
      throw err;
    }
  }
  throw lastError;
}

export async function listCoupons(): Promise<Coupon[]> {
  const all = await readAll();
  return all.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function getCoupon(code: string): Promise<Coupon | null> {
  const all = await readAll();
  const needle = code.trim().toLowerCase();
  return all.find((c) => c.code.toLowerCase() === needle) || null;
}

export async function createCoupon(coupon: Coupon): Promise<Coupon> {
  const all = await readAll();
  if (all.some((c) => c.code.toLowerCase() === coupon.code.toLowerCase())) {
    throw new Error("A coupon with this code already exists");
  }
  all.push(coupon);
  await writeAll(all);
  return coupon;
}

/**
 * Read-modify-write a single coupon. `mutate` may throw to abort with a
 * business-rule error (e.g. already redeemed).
 */
export async function updateCoupon(
  code: string,
  mutate: (current: Coupon) => Coupon
): Promise<Coupon> {
  const all = await readAll();
  const needle = code.trim().toLowerCase();
  const idx = all.findIndex((c) => c.code.toLowerCase() === needle);
  if (idx === -1) throw new Error("Coupon not found");

  const updated = mutate({ ...all[idx] });
  all[idx] = updated;
  await writeAll(all);
  return updated;
}

export function isStorageConfigured(): boolean {
  return useBlob;
}
