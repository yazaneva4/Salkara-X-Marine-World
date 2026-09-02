import "server-only";

import Ably from "ably";

export const COUPON_REALTIME_CHANNEL = "salkara-marine-coupons";

let client: Ably.Rest | null = null;

function getAbly(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  if (!client) client = new Ably.Rest({ key });
  return client;
}

/**
 * Notify connected dashboards that the Blob-backed coupon state changed.
 * The event deliberately contains no customer PII; clients re-read the
 * authenticated API, which remains the source of truth backed by Vercel Blob.
 * Realtime delivery is best-effort so an Ably outage never makes a successful
 * coupon write look like a failed write.
 */
export async function publishCouponChanged(code: string): Promise<void> {
  const ably = getAbly();
  if (!ably) {
    console.warn("ABLY_API_KEY is not configured; coupon realtime is disabled.");
    return;
  }

  try {
    await ably.channels.get(COUPON_REALTIME_CHANNEL).publish("coupon.changed", {
      code,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to publish coupon realtime event:", error);
  }
}
