import jwt from "jsonwebtoken";
import type { APIContext } from "astro";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface UserPayload {
  id: number;
  username: string;
  email: string;
  role_id?: number;
  iat?: number;
  exp?: number;
}

export function signToken(user: Omit<UserPayload, "iat" | "exp">): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(context: APIContext): string | null {
  const cookies = context.cookies;
  return cookies.get("ff_token")?.value || null;
}

export function getUserFromContext(context: APIContext): UserPayload | null {
  const token = getTokenFromCookies(context);
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(
  context: APIContext,
  token: string,
  maxAge: number = 86400,
): void {
  const isProduction = process.env.NODE_ENV === "production";
  context.cookies.set("ff_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export function clearAuthCookie(context: APIContext): void {
  context.cookies.delete("ff_token");
}
