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
