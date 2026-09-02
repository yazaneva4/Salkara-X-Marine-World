import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { updateCoupon } from "@/lib/store";
import { publishCouponChanged } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.role !== "salkara") {
    return NextResponse.json(
      { error: "Only Salkara staff can apply the food discount" },
      { status: 403 }
    );
  }

  try {
    const coupon = await updateCoupon(params.code, (c) => {
      if (c.status === "issued") {
        throw new Error(
          "Customer must use this coupon at CISO Marine World before the Salkara discount can be applied."
        );
      }
      if (c.status === "completed") {
        throw new Error("The Salkara food discount has already been applied.");
      }
      return {
        ...c,
        status: "completed",
        salkaraUsedAt: new Date().toISOString(),
        salkaraUsedBy: session.username,
      };
    });

    await publishCouponChanged(coupon.code);
    return NextResponse.json({ coupon });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not redeem coupon";
    const status = message.includes("not found") ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
