import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { createCoupon, listCoupons } from "@/lib/store";
import { publishCouponChanged } from "@/lib/realtime";
import { couponExpired, normalizeWhatsApp, validCouponDate } from "@/lib/coupon";
import { generateCode } from "@/lib/code";
import type { Coupon } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const coupons = await listCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.role !== "salkara") {
    return NextResponse.json(
      { error: "Only Salkara staff can issue coupons" },
      { status: 403 }
    );
  }

  let body: { name?: string; whatsapp?: string; validUntil?: string; notes?: string; channel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body) ||
      typeof body.name !== "string" || typeof body.whatsapp !== "string" ||
      typeof body.validUntil !== "string" ||
      (body.notes !== undefined && typeof body.notes !== "string")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = body.name.trim();
  const whatsapp = normalizeWhatsApp(body.whatsapp || "");
  const validUntil = (body.validUntil || "").trim();
  const notes = (body.notes || "").trim();
// Google Chat coupons are sent to an email address, so a phone number is optional there.
const chatOnly = body.channel === "google-chat";

  if (!name) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }
  if (whatsapp.length < 8 && !(whatsapp.length === 0 && chatOnly)) {
    return NextResponse.json(
      { error: "A valid WhatsApp number (with country code) is required" },
      { status: 400 }
    );
  }
  if (!validCouponDate(validUntil)) {
    return NextResponse.json(
      { error: "A valid 'valid until' date is required" },
      { status: 400 }
    );
  }
if (couponExpired(validUntil)) {
  return NextResponse.json(
    { error: "The 'valid until' date has already passed" },
    { status: 400 }
  );
}

  // Generate a unique code, retrying ONLY on the astronomically unlikely code
  // collision. Any other error (e.g. storage misconfiguration) is surfaced so
  // it can be diagnosed instead of being silently swallowed.
  let coupon: Coupon | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate: Coupon = {
      code: generateCode(),
      name,
      whatsapp,
      validUntil,
      status: "issued",
      issuedAt: new Date().toISOString(),
      issuedBy: session.username,
      marineUsedAt: null,
      marineUsedBy: null,
      salkaraUsedAt: null,
      salkaraUsedBy: null,
      notes: notes || undefined,
    };
    try {
      coupon = await createCoupon(candidate);
      break;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("already exists")) continue;
      break;
    }
  }

  if (!coupon) {
    console.error("Failed to create coupon:", lastError);
    const detail =
      lastError instanceof Error ? lastError.message : "unknown error";
    return NextResponse.json(
      { error: `Could not create coupon: ${detail}` },
      { status: 500 }
    );
  }

  // Blob is the source of truth. Ably only invalidates connected dashboards;
  // it intentionally receives no customer PII.
  await publishCouponChanged(coupon.code);

  return NextResponse.json({ coupon }, { status: 201 });
}
