import { NextResponse } from "next/server";
import Ably from "ably";
import { getServerSession } from "@/lib/auth";
import { COUPON_REALTIME_CHANNEL } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
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
    const clientId = `${session.role}:${session.username}`;
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      ttl: 60 * 60 * 1000,
      capability: JSON.stringify({
        [COUPON_REALTIME_CHANNEL]: ["subscribe"],
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
