import { Request, Response, NextFunction } from "express";

// Lazy load repositories to avoid circular dependency issues
async function getRepositories() {
  const { PermissionRepository } =
    await import("./infrastructure/repositories/permissionRepository");
  const { UserRepository } =
    await import("./infrastructure/repositories/userRepository");
  const { RoleRepository } =
    await import("./infrastructure/repositories/roleRepository");

  return {
    permissionRepository: new PermissionRepository(),
    userRepository: new UserRepository(),
    roleRepository: new RoleRepository(),
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
