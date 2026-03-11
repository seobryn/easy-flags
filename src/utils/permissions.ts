import type { APIContext } from "astro";
import { getUserFromContext, type UserPayload } from "./auth";
import { getDatabase } from "@/lib/db";

/**
 * Role IDs
 */
export const ROLES = {
  ADMIN: 1,
  EDITOR: 2,
  VIEWER: 3,
} as const;

/**
 * Role names
 */
export const ROLE_NAMES = {
  [ROLES.ADMIN]: "admin",
  [ROLES.EDITOR]: "editor",
  [ROLES.VIEWER]: "viewer",
} as const;

/**
 * Check if a user is a global admin
 */
export function isGlobalAdmin(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role_id === ROLES.ADMIN;
}

/**
 * Check if a user owns a space
 */
export async function isSpaceOwner(
  userId: number,
  spaceId: number,
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT owner_id FROM spaces WHERE id = ?",
      args: [spaceId],
    });

    if (result.rows.length === 0) {
      return false;
    }

    return (result.rows[0]?.owner_id as number) === userId;
  } catch (error) {
    console.error("Error checking space ownership:", error);
    return false;
  }
}

/**
 * Get user's role in a space
 * Returns role_id or null if user is not a member
 */
export async function getUserSpaceRole(
  userId: number,
  spaceId: number,
): Promise<number | null> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: `
        SELECT role_id FROM space_members 
        WHERE user_id = ? AND space_id = ?
      `,
      args: [userId, spaceId],
    });

    if (result.rows.length === 0) {
      // Check if user is the space owner
      const ownerResult = await db.execute({
        sql: "SELECT owner_id FROM spaces WHERE id = ?",
        args: [spaceId],
      });

      if (
        ownerResult.rows.length > 0 &&
        (ownerResult.rows[0]?.owner_id as number) === userId
      ) {
        // Owner has admin role in their space
        return ROLES.ADMIN;
      }

      return null;
    }

    return (result.rows[0]?.role_id as number) || null;
  } catch (error) {
    console.error("Error getting user space role:", error);
    return null;
  }
}

/**
 * Check if user has at least a specific role in a space
 */
export async function hasSpaceRole(
  userId: number,
  spaceId: number,
  requiredRole: number,
): Promise<boolean> {
  try {
    const userRole = await getUserSpaceRole(userId, spaceId);

    if (userRole === null) {
      return false;
    }

    // Lower role IDs have higher permissions
    // Admin (1) > Editor (2) > Viewer (3)
    return userRole <= requiredRole;
  } catch (error) {
    console.error("Error checking space role:", error);
    return false;
  }
}

/**
 * Check if user is admin in a space
 */
export async function isSpaceAdmin(
  userId: number,
  spaceId: number,
): Promise<boolean> {
  return hasSpaceRole(userId, spaceId, ROLES.ADMIN);
}

/**
 * Check if user is editor or above in a space
 */
export async function isSpaceEditor(
  userId: number,
  spaceId: number,
): Promise<boolean> {
  return hasSpaceRole(userId, spaceId, ROLES.EDITOR);
}

/**
 * Check if user can access a space (is a member or owner)
 */
export async function canAccessSpace(
  userId: number,
  spaceId: number,
): Promise<boolean> {
  const role = await getUserSpaceRole(userId, spaceId);
  return role !== null;
}

/**
 * Middleware: Check if user is authenticated and is a space admin
 */
export async function checkSpaceAdminAuth(
  context: APIContext,
  spaceId: number,
): Promise<{ isAuthorized: boolean; user: UserPayload | null }> {
  const user = getUserFromContext(context);

  if (!user) {
    return { isAuthorized: false, user: null };
  }

  // Global admins have access to everything
  if (isGlobalAdmin(user)) {
    return { isAuthorized: true, user };
  }

  // Check if user is admin in the specific space
  const isAdmin = await isSpaceAdmin(user.id, spaceId);
  return { isAuthorized: isAdmin, user };
}

/**
 * Middleware: Check if user is authenticated and can edit a space
 */
export async function checkSpaceEditorAuth(
  context: APIContext,
  spaceId: number,
): Promise<{ isAuthorized: boolean; user: UserPayload | null }> {
  const user = getUserFromContext(context);

  if (!user) {
    return { isAuthorized: false, user: null };
  }

  // Global admins have access to everything
  if (isGlobalAdmin(user)) {
    return { isAuthorized: true, user };
  }

  // Check if user is editor or above in the specific space
  const isEditor = await isSpaceEditor(user.id, spaceId);
  return { isAuthorized: isEditor, user };
}

/**
 * Middleware: Check if user can access a space
 */
export async function checkSpaceAccessAuth(
  context: APIContext,
  spaceId: number,
): Promise<{ isAuthorized: boolean; user: UserPayload | null }> {
  const user = getUserFromContext(context);

  if (!user) {
    return { isAuthorized: false, user: null };
  }

  // Global admins have access to everything
  if (isGlobalAdmin(user)) {
    return { isAuthorized: true, user };
  }

  // Check if user can access the space
  const canAccess = await canAccessSpace(user.id, spaceId);
  return { isAuthorized: canAccess, user };
}
