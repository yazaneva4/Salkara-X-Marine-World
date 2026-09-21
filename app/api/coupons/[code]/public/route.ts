import { NextResponse } from "next/server";
import { getCoupon } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const coupon = await getCoupon(params.code);
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      coupon: {
        status: coupon.status,
        marineUsedAt: coupon.marineUsedAt,
        salkaraUsedAt: coupon.salkaraUsedAt,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
