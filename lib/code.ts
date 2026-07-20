import crypto from "node:crypto";

// Unambiguous alphabet (no O/0, I/1, etc.) for human-readable codes.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Generate a unique, human-friendly coupon code. Server-side only. */
export function generateCode(): string {
  const bytes = crypto.randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += ALPHABET[bytes[i] % ALPHABET.length];
  return `SALMAR-${suffix}`;
}
