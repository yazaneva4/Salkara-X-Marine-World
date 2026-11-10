import crypto from "node:crypto";
import type { Role } from "./types";

/**
 * Resolve the Vercel Blob read-write token.
 *
 * Normally it lives in `BLOB_READ_WRITE_TOKEN`, but if the Blob store was
 * connected with a custom environment-variable prefix, the token ends up under
 * a different name (e.g. `BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN`). Vercel Blob
 * tokens always start with `vercel_blob_rw_`, so as a fallback we find it by its
 * value — this makes the app work regardless of the prefix chosen in Vercel.
 */
function resolveBlobToken(): string {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const value of Object.values(process.env)) {
    if (typeof value === "string" && value.startsWith("vercel_blob_rw_")) {
      return value;
    }
  }
  return "";
}

/**
 * Server-side configuration read from environment variables.
 * Never import this into a client component.
 *
 * Deployed builds fail closed: a missing or placeholder secret disables
 * sign-in instead of quietly falling back to a value that is published in this
 * repository. Local development keeps the convenient defaults.
 */
const DEV_SESSION_SECRET = "dev-insecure-secret-change-me-please-change";
const MIN_SECRET_LENGTH = 32;

const isProduction =
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

/** Placeholders shipped in .env.example must never reach a deployment. */
const isPlaceholder = (value: string): boolean => /^change-me/i.test(value);

function readSecret(value: string | undefined): string {
  const secret = (value || "").trim();
  if (
    secret.length >= MIN_SECRET_LENGTH &&
    secret !== DEV_SESSION_SECRET &&
    !isPlaceholder(secret)
  ) {
    return secret;
  }
  return isProduction ? "" : DEV_SESSION_SECRET;
}

function readPassword(value: string | undefined, devDefault: string): string {
  const password = (value || "").trim();
  if (password.length >= 8 && password !== devDefault && !isPlaceholder(password)) {
    return password;
  }
  // An empty password can never match, so that portal cannot be signed into.
  return isProduction ? "" : devDefault;
}

const sessionSecret = readSecret(process.env.SESSION_SECRET);
const dedicatedKey = (process.env.DATA_ENCRYPTION_KEY || "").trim();

export const appConfig = {
  sessionSecret,
  // Any dedicated key is used verbatim: changing how a key is derived would
  // make the already-encrypted coupon blob unreadable.
  dataEncryptionKey:
    dedicatedKey || sessionSecret || DEV_SESSION_SECRET,
  blobToken: resolveBlobToken(),
  accounts: {
    salkara: {
      username: (process.env.SALKARA_USERNAME || "").trim() || "salkara",
      password: readPassword(process.env.SALKARA_PASSWORD, "salkara123"),
    },
    marine: {
      username: (process.env.MARINE_USERNAME || "").trim() || "marine",
      password: readPassword(process.env.MARINE_PASSWORD, "marine123"),
    },
  },
};

/** False when this deployment has no usable signing secret. */
export const sessionsAvailable = sessionSecret.length > 0;

/** Human-readable list of what a deployment still needs. Empty when healthy. */
export const configProblems: string[] = [];
if (!sessionsAvailable) {
  configProblems.push("SESSION_SECRET is missing or shorter than 32 characters.");
}
if (!appConfig.accounts.salkara.password) {
  configProblems.push("SALKARA_PASSWORD is not set.");
}
if (!appConfig.accounts.marine.password) {
  configProblems.push("MARINE_PASSWORD is not set.");
}

/** True only when every portal can sign in safely. */
export const accountsConfigured = configProblems.length === 0;

// Hash both sides so the comparison is constant time and never leaks a length.
const digest = (value: string): Buffer =>
  crypto.createHash("sha256").update(value, "utf8").digest();
function sameText(a: string, b: string): boolean {
  return crypto.timingSafeEqual(digest(a), digest(b));
}

export function checkCredentials(
  role: Role,
  username: string,
  password: string
): boolean {
  const acct = appConfig.accounts[role];
  if (!acct || !acct.username || !acct.password) return false;
  const userOk = sameText(username, acct.username);
  const passOk = sameText(password, acct.password);
  return userOk && passOk;
}

export const roleLabel: Record<Role, string> = {
  salkara: "Salkara Restaurant",
  marine: "CISO Marine World",
};
