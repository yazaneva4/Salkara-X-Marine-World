/** Small client-side helpers (safe to import in client components). */

export function baseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function couponUrl(code: string): string {
  return `${baseUrl()}/coupon/${encodeURIComponent(code)}`;
}

export function defaultValidUntil(): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), 11, 31); // 31 Dec this year
  return end.toISOString().slice(0, 10);
}
