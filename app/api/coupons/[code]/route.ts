import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getCoupon } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const coupon = await getCoupon(params.code);
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }
  return NextResponse.json({ coupon });
}
