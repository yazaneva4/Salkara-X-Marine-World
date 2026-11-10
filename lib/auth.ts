import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { appConfig, sessionsAvailable } from "./config";
import type { Role, Session } from "./types";

export const SESSION_COOKIE = "salkara_session";

// A deployment without a real secret must not issue or trust sessions.
const secretKey = new TextEncoder().encode(appConfig.sessionSecret || "unconfigured");

export async function signSession(session: Session): Promise<string> {
  if (!sessionsAvailable) throw new Error("SESSION_SECRET is not configured on this deployment");
  return new SignJWT({ role: session.role, username: session.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<Session | null> {
  if (!sessionsAvailable) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const role = payload.role;
    if (role !== "salkara" && role !== "marine") return null;
    return { role: role as Role, username: String(payload.username || "") };
  } catch {
    return null;
  }
}

/** Read and verify the session from the request cookies (server components / route handlers). */
export async function getServerSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
