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
 */
export const appConfig = {
  sessionSecret:
    process.env.SESSION_SECRET || "dev-insecure-secret-change-me-please-change",
  dataEncryptionKey:
    process.env.DATA_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "dev-insecure-secret-change-me-please-change",
  blobToken: resolveBlobToken(),
  accounts: {
    salkara: {
      username: process.env.SALKARA_USERNAME || "salkara",
      password: process.env.SALKARA_PASSWORD || "salkara123",
    },
    marine: {
      username: process.env.MARINE_USERNAME || "marine",
      password: process.env.MARINE_PASSWORD || "marine123",
    },
  },
};

export function checkCredentials(
  role: Role,
  username: string,
  password: string
): boolean {
  const acct = appConfig.accounts[role];
  if (!acct) return false;
  // Constant-ish comparison; volumes are tiny so this is sufficient.
  return username === acct.username && password === acct.password;
}

export const roleLabel: Record<Role, string> = {
  salkara: "Salkara Restaurant",
  marine: "CISO Marine World",
};
