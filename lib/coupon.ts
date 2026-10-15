import type { Coupon, PublicCoupon } from "./types";

/** Normalise a WhatsApp number to digits only (country code + number, no "+"). */
export function normalizeWhatsApp(input: string): string {
  return (input || "").replace(/[^\d]/g, "");
}

export function maskWhatsApp(input: string): string {
  const d = normalizeWhatsApp(input);
  if (d.length <= 4) return d;
  return `${"•".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}`;
}

export function toPublicCoupon(c: Coupon): PublicCoupon {
  return {
    code: c.code,
    name: c.name,
    validUntil: c.validUntil,
    status: c.status,
    issuedAt: c.issuedAt,
    marineUsedAt: c.marineUsedAt,
    salkaraUsedAt: c.salkaraUsedAt,
    notes: c.notes,
    whatsappMasked: maskWhatsApp(c.whatsapp),
  };
}

export function statusLabel(status: Coupon["status"]): string {
  switch (status) {
    case "issued":
      return "Issued — ready to use at Marine World";
    case "marine_used":
      return "Used at Marine World — food discount ready at Salkara";
    case "completed":
      return "Completed — both discounts applied";
  }
}


/** Reject date-shaped values such as February 30 instead of normalizing them. */
export function validCouponDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Coupons remain valid through the end of their printed date in Saudi time. */
export function couponExpired(validUntil: string, now = new Date()): boolean {
  if (!validCouponDate(validUntil)) return true;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  return validUntil < today;
}
