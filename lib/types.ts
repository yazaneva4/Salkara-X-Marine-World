export type Role = "salkara" | "marine";

export interface Session {
  role: Role;
  username: string;
}

/**
 * Lifecycle of a coupon:
 *  issued       -> created by Salkara, not used anywhere yet
 *  marine_used  -> redeemed at CISO Marine World (customer got 10% off tickets)
 *  completed    -> also redeemed at Salkara (customer got 10% off the food bill)
 *
 * A coupon can only be redeemed at Salkara AFTER it has been used at Marine World.
 */
export type CouponStatus = "issued" | "marine_used" | "completed";

export interface Coupon {
  code: string;
  name: string;
  whatsapp: string;
  validUntil: string; // yyyy-mm-dd
  status: CouponStatus;
  issuedAt: string; // ISO timestamp
  issuedBy: string; // staff username
  marineUsedAt: string | null;
  marineUsedBy: string | null;
  salkaraUsedAt: string | null;
  salkaraUsedBy: string | null;
  notes?: string;
}

export interface PublicCoupon
  extends Omit<Coupon, "whatsapp" | "issuedBy" | "marineUsedBy" | "salkaraUsedBy"> {
  // A trimmed coupon that is safe to expose on the public coupon page.
  whatsappMasked: string;
}
