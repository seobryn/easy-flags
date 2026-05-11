import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { APIContext } from "astro";
import { getUserById } from "@/lib/auth-service";
import { getDatabase } from "@/lib/db";
import { EnvManager } from "@/lib/env";

const JWT_SECRET = EnvManager.get("JWT_SECRET") || "your-secret-key";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

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
  return jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
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
  const isProduction = EnvManager.get("NODE_ENV") === "production";
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
    secure: EnvManager.get("NODE_ENV") === "production",
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

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createRefreshToken(userId: number): Promise<string> {
  const db = await getDatabase();

  const token = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.execute({
    sql: `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    args: [userId, tokenHash, expiresAt.toISOString()],
  });

  return token;
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ userId: number; tokenId: number } | null> {
  const db = await getDatabase();

  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `SELECT id, user_id, expires_at, revoked FROM refresh_tokens 
          WHERE token_hash = ? AND expires_at > ?`,
    args: [tokenHash, now],
  });

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  if ((row.revoked as number) === 1) {
    return null;
  }

  return { userId: row.user_id as number, tokenId: row.id as number };
}

export async function rotateRefreshToken(
  oldToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const db = await getDatabase();

  const tokenHash = hashToken(oldToken);
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `SELECT id, user_id, expires_at, revoked FROM refresh_tokens 
          WHERE token_hash = ? AND expires_at > ?`,
    args: [tokenHash, now],
  });

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  if ((row.revoked as number) === 1) {
    return null;
  }

  await db.execute({
    sql: `UPDATE refresh_tokens SET revoked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [row.id as number],
  });

  const user = await getUserById(row.user_id as number);
  if (!user) return null;

  const accessToken = signToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    token_version: user.token_version,
  });

  const newRefreshToken = await createRefreshToken(row.user_id as number);

  return { accessToken, refreshToken: newRefreshToken };
}

export function setRefreshTokenCookie(
  context: APIContext,
  token: string,
): void {
  const isProduction = EnvManager.get("NODE_ENV") === "production";
  const maxAge = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  context.cookies.set("ff_refresh_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export function getRefreshTokenFromCookies(
  context: APIContext,
): string | null {
  return context.cookies.get("ff_refresh_token")?.value || null;
}

export function clearRefreshTokenCookie(context: APIContext): void {
  context.cookies.set("ff_refresh_token", "", {
    httpOnly: true,
    secure: EnvManager.get("NODE_ENV") === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  const db = await getDatabase();

  await db.execute({
    sql: `UPDATE refresh_tokens SET revoked = 1, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ? AND revoked = 0`,
    args: [userId],
  });
}
