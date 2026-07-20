import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { updateCoupon } from "@/lib/store";

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
  if (session.role !== "marine") {
    return NextResponse.json(
      { error: "Only CISO Marine World staff can redeem the ticket discount" },
      { status: 403 }
    );
  }

  try {
    const coupon = await updateCoupon(params.code, (c) => {
      if (c.status !== "issued") {
        throw new Error(
          c.status === "completed"
            ? "This coupon has already been fully used."
            : "This coupon has already been used at Marine World."
        );
      }
      return {
        ...c,
        status: "marine_used",
        marineUsedAt: new Date().toISOString(),
        marineUsedBy: session.username,
      };
    });
    return NextResponse.json({ coupon });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not redeem coupon";
    const status = message.includes("not found") ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
