import { NextRequest, NextResponse } from "next/server";
import { checkCredentials } from "@/lib/config";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { role?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const role = body.role as Role;
  const username = (body.username || "").trim();
  const password = body.password || "";

  if (role !== "salkara" && role !== "marine") {
    return NextResponse.json({ error: "Please choose a portal" }, { status: 400 });
  }
  if (!checkCredentials(role, username, password)) {
    return NextResponse.json(
      { error: "Incorrect username or password" },
      { status: 401 }
    );
  }

  const token = await signSession({ role, username });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
