import jwt from "jsonwebtoken";
import type { APIContext } from "astro";
import { getUserById } from "@/lib/auth-service";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface UserPayload {
  id: number;
  username: string;
  email: string;
  role_id?: number;
  token_version?: number;
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

/**
 * Verify token and check against current token version
 * Returns null if token is invalid or revoked
 */
export async function verifyTokenWithVersion(
  token: string,
  currentTokenVersion: number,
): Promise<UserPayload | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  // Check if token version matches (token is not revoked)
  if (
    payload.token_version !== undefined &&
    payload.token_version !== currentTokenVersion
  ) {
    return null; // Token has been revoked
  }

  return payload;
}

export function getTokenFromCookies(context: APIContext): string | null {
  // Try Authorization header first
  const authHeader = context.request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookies
  const cookies = context.cookies;
  return cookies.get("ff_token")?.value || null;
}

export function getUserFromContext(context: APIContext): UserPayload | null {
  const token = getTokenFromCookies(context);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get user from context with token version verification
 * Checks if the token has been revoked by verifying token_version
 */
export async function getUserFromContextWithVersionCheck(
  context: APIContext,
): Promise<UserPayload | null> {
  const token = getTokenFromCookies(context);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Check if token has been revoked by verifying token_version
  try {
    const user = await getUserById(payload.id);
    if (!user) return null;

    // If token_version doesn't match, the token has been revoked
    if (
      payload.token_version !== undefined &&
      payload.token_version !== user.token_version
    ) {
      return null;
    }

    return payload;
  } catch {
    // If we can't check, allow the request but it's safer to deny
    return null;
  }
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
  context.cookies.set("ff_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Check if user has super user privileges
 * @param user User payload from JWT
 * @returns true if user is super user (role_id = 1)
 */
export function isSuperUser(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role_id === 1;
}

/**
 * Check if user has admin or super user privileges
 * @param user User payload from JWT
 * @returns true if user is admin (role_id = 1 or 2)
 */
export function isAdmin(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role_id === 1 || user.role_id === 2;
}
