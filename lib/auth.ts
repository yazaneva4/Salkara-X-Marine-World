import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { appConfig } from "./config";
import type { Role, Session } from "./types";

export const SESSION_COOKIE = "salkara_session";

const secretKey = new TextEncoder().encode(appConfig.sessionSecret);

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ role: session.role, username: session.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<Session | null> {
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
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
