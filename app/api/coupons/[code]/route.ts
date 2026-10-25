import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { deleteCoupon, getCoupon } from "@/lib/store";
import { publishCouponChanged } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const coupon = await getCoupon(code);
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }
  return NextResponse.json({ coupon });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.role !== "salkara") {
    return NextResponse.json(
      { error: "Only Salkara staff can delete coupons" },
      { status: 403 }
    );
  }

  try {
    const removed = await deleteCoupon(code);
    await publishCouponChanged(removed.code);
    return NextResponse.json({ ok: true, code: removed.code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete coupon";
    const status = message.includes("not found") ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
