import { NextRequest, NextResponse } from "next/server";
import * as Ably from "ably";
import { getServerSession } from "@/lib/auth";
import {
  COUPON_REALTIME_CHANNEL,
  couponRealtimeChannel,
} from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase() || "";
  const validPublicCode = /^SALMAR-[A-Z0-9]{6}$/.test(code);

  if (!session && !validPublicCode) {
    return NextResponse.json({ error: "A valid coupon code is required" }, { status: 400 });
  }

  const key = process.env.ABLY_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Realtime service is not configured" },
      { status: 503 }
    );
  }

  try {
    const ably = new Ably.Rest({ key });
    const channel = session
      ? COUPON_REALTIME_CHANNEL
      : couponRealtimeChannel(code);
    const clientId = session
      ? `${session.role}:${session.username}`
      : `coupon-viewer:${code}`;
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      ttl: 60 * 60 * 1000,
      capability: JSON.stringify({
        [channel]: ["subscribe"],
      }),
    });

    return NextResponse.json(tokenRequest, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to create realtime auth token:", error);
    return NextResponse.json(
      { error: "Could not initialize realtime connection" },
      { status: 500 }
    );
  }
}
