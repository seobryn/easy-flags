import { Request, Response, NextFunction } from "express";

// Lazy load repositories to avoid circular dependency issues
async function getRepositories() {
  const { PermissionRepository } =
    await import("./infrastructure/repositories/permissionRepository");
  const { UserRepository } =
    await import("./infrastructure/repositories/userRepository");
  const { RoleRepository } =
    await import("./infrastructure/repositories/roleRepository");
  const { SpaceRepository } =
    await import("./infrastructure/repositories/spaceRepository");

  return {
    permissionRepository: new PermissionRepository(),
    userRepository: new UserRepository(),
    roleRepository: new RoleRepository(),
    spaceRepository: new SpaceRepository(),
  };
}

/**
 * Middleware to check if user has specific permission
 * Used to protect routes based on permissions
 */

export function requirePermission(permission: string | string[]) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { userRepository, permissionRepository } = await getRepositories();

      // Get user's role
      const userRecord = await userRepository.findById(user.id);
      if (!userRecord || !userRecord.role_id) {
        return next({ status: 403, message: "User has no role assigned" });
      }

      // Get user's role permissions
      const userPermissions = await permissionRepository.getRolePermissions(
        userRecord.role_id,
      );
      const userPermissionNames = userPermissions.map(
        (p: { name: string }) => p.name,
      );

      // Check if user has any of the required permissions
      const hasPermission = permissions.some((p) =>
        userPermissionNames.includes(p),
      );

      if (!hasPermission) {
        return next({
          status: 403,
          message: "Insufficient permissions",
          required: permissions,
        });
      }

      next();
    } catch (err) {
      console.error("Permission check error:", err);
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}

/**
 * Middleware to check if user has access to a specific space
 * Checks if user is the owner or a member of the space
 */
export function requireSpaceAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get spaceId from route params
      const spaceId = Number((req as any).params?.spaceId);
      if (!spaceId || isNaN(spaceId)) {
        return res.status(400).json({ error: "Invalid space ID" });
      }

      const { spaceRepository } = await getRepositories();

      // Check if user is owner
      const isOwner = await spaceRepository.isSpaceOwner(spaceId, user.id);
      if (isOwner) {
        return next();
      }

      // Check if user is member
      const isMember = await spaceRepository.isUserInSpace(spaceId, user.id);
      if (!isMember) {
        return res
          .status(403)
          .json({ error: "You don't have access to this space" });
      }

      next();
    } catch (err) {
      console.error("Space access check error:", err);
      res.status(500).json({ error: "Space access check failed" });
    }
  };
}

/**
 * Middleware to check if user is the owner of a specific space
 * Used for operations that only the owner can perform
 */
export function requireSpaceOwner() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get spaceId from route params
      const spaceId = Number((req as any).params?.spaceId);
      if (!spaceId || isNaN(spaceId)) {
        return res.status(400).json({ error: "Invalid space ID" });
      }

      const { spaceRepository } = await getRepositories();

      // Check if user is owner
      const isOwner = await spaceRepository.isSpaceOwner(spaceId, user.id);
      if (!isOwner) {
        return res
          .status(403)
          .json({ error: "Only space owner can perform this action" });
      }

      next();
    } catch (err) {
      console.error("Space owner check error:", err);
      res.status(500).json({ error: "Space owner check failed" });
    }
  };
}
