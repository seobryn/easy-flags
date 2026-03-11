import type { APIContext } from "astro";
import { getUserFromContext, type UserPayload } from "./auth";
import { getDatabase } from "@/lib/db";

/**
 * Role IDs
 */
export const ROLES = {
  SUPER_USER: 1,
  ADMIN: 2,
  EDITOR: 3,
  VIEWER: 4,
} as const;

/**
 * Role names
 */
export const ROLE_NAMES = {
  [ROLES.SUPER_USER]: "super_user",
  [ROLES.ADMIN]: "admin",
  [ROLES.EDITOR]: "editor",
  [ROLES.VIEWER]: "viewer",
} as const;

/**
 * Feature names - granular control
 */
export const FEATURES = {
  FEATURE_FLAGS: "feature_flags",
  SPACES: "spaces",
  ENVIRONMENTS: "environments",
  BILLING: "billing",
  SETTINGS: "settings",
  DATABASE_INSPECTOR: "database_inspector",
  API_REFERENCE: "api_reference",
} as const;

/**
 * Default feature permissions by role
 */
export const DEFAULT_FEATURE_PERMISSIONS: Record<
  number,
  (typeof FEATURES)[keyof typeof FEATURES][]
> = {
  [ROLES.SUPER_USER]: [
    FEATURES.FEATURE_FLAGS,
    FEATURES.SPACES,
    FEATURES.ENVIRONMENTS,
    FEATURES.BILLING,
    FEATURES.SETTINGS,
    FEATURES.DATABASE_INSPECTOR,
    FEATURES.API_REFERENCE,
  ],
  [ROLES.ADMIN]: [
    FEATURES.FEATURE_FLAGS,
    FEATURES.SPACES,
    FEATURES.ENVIRONMENTS,
    FEATURES.BILLING,
    FEATURES.SETTINGS,
    FEATURES.API_REFERENCE,
  ],
  [ROLES.EDITOR]: [
    FEATURES.FEATURE_FLAGS,
    FEATURES.SPACES,
    FEATURES.ENVIRONMENTS,
    FEATURES.API_REFERENCE,
  ],
  [ROLES.VIEWER]: [FEATURES.FEATURE_FLAGS, FEATURES.API_REFERENCE],
};

/**
 * Check if a user is a global admin
 */
export function isGlobalAdmin(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role_id === ROLES.ADMIN;
}

/**
 * Check if a user is a super user
 */
export function isSuperUser(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role_id === ROLES.SUPER_USER;
}

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(
  user: UserPayload | null,
  feature: (typeof FEATURES)[keyof typeof FEATURES],
): boolean {
  if (!user) return false;

  // Super users have access to all features
  if (user.role_id === ROLES.SUPER_USER) return true;

  // Check default feature permissions by role
  const allowedFeatures = DEFAULT_FEATURE_PERMISSIONS[user.role_id];
  return allowedFeatures ? allowedFeatures.includes(feature) : false;
}

/**
 * Require feature access or throw error
 */
export function requireFeatureAccess(
  user: UserPayload | null,
  feature: (typeof FEATURES)[keyof typeof FEATURES],
): boolean {
  if (!hasFeatureAccess(user, feature)) {
    throw new Error(`User does not have access to ${feature} feature`);
  }
  return true;
}

/**
 * Check feature access asynchronously from database
 */
export async function hasFeatureAccessFromDB(
  userId: number,
  feature: (typeof FEATURES)[keyof typeof FEATURES],
): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Get user's role
    const userResult = await db.execute({
      sql: "SELECT role_id FROM users WHERE id = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return false;
    }

    const roleId = userResult.rows[0]?.role_id as number;

    // Check if super user (role_id = 1)
    if (roleId === ROLES.SUPER_USER) {
      return true;
    }

    // Check feature permissions table
    const permResult = await db.execute({
      sql: "SELECT feature_name FROM feature_permissions WHERE role_id = ? AND feature_name = ?",
      args: [roleId, feature],
    });

    return permResult.rows.length > 0;
  } catch (error) {
    console.error("Error checking feature access from DB:", error);
    return false;
  }
}

/**
 * Middleware: Check feature access
 */
export async function checkFeatureAuth(
  context: APIContext,
  feature: (typeof FEATURES)[keyof typeof FEATURES],
): Promise<{ isAuthorized: boolean; user: UserPayload | null }> {
  const user = getUserFromContext(context);

  if (!user) {
    return { isAuthorized: false, user: null };
  }

  // Check from database for more granular control
  const hasAccess = await hasFeatureAccessFromDB(user.id, feature);
  return { isAuthorized: hasAccess, user };
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
