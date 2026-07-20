import type { Role } from "./types";

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
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || "",
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
