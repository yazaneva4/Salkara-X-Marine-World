import "server-only";

import * as Ably from "ably";

export const COUPON_REALTIME_CHANNEL = "salkara-marine-coupons";

export function couponRealtimeChannel(code: string): string {
  return `salkara-marine-coupon:${code.trim().toUpperCase()}`;
}

let client: Ably.Rest | null = null;

function getAbly(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  if (!client) client = new Ably.Rest({ key });
  return client;
}

/**
 * Notify connected dashboards that the Blob-backed coupon state changed.
 * The event contains no customer PII; clients re-read the authenticated API.
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
    const event = { code, at: new Date().toISOString() };
    const results = await Promise.allSettled([
      ably.channels.get(COUPON_REALTIME_CHANNEL).publish("coupon.changed", event),
      ably.channels.get(couponRealtimeChannel(code)).publish("coupon.changed", event),
    ]);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Failed to publish coupon realtime event:", result.reason);
      }
    }
  } catch (error) {
    console.error("Failed to publish coupon realtime event:", error);
  }
}
