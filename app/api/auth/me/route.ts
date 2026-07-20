import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  return NextResponse.json({ session });
}
