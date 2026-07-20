import "server-only";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";
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
const useBlob = !!appConfig.blobToken;

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

  const { blobs } = await list({
    prefix: DB_PATHNAME,
    limit: 1,
    token: appConfig.blobToken,
  });
  if (!blobs.length) return [];

  const res = await fetch(`${blobs[0].url}?_=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return [];

  const buf = Buffer.from(await res.arrayBuffer());
  try {
    return JSON.parse(decrypt(buf)) as Coupon[];
  } catch {
    return [];
  }
}

async function writeAll(coupons: Coupon[]): Promise<void> {
  const json = JSON.stringify(coupons);
  if (!useBlob) {
    await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
    await fs.writeFile(LOCAL_PATH, json, "utf8");
    return;
  }

  await put(DB_PATHNAME, encrypt(json), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/octet-stream",
    cacheControlMaxAge: 0,
    token: appConfig.blobToken,
  });
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
