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
export async function requirePermission(permission: string | string[]) {
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
        return res.status(403).json({ error: "User has no role assigned" });
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
        return res.status(403).json({
          error: "Insufficient permissions",
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
 * Middleware to check if user has specific role
 * Used to protect routes based on roles
 */
export async function requireRole(role: string | string[]) {
  const roles = Array.isArray(role) ? role : [role];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { userRepository, roleRepository } = await getRepositories();

      // Get user's role
      const userRecord = await userRepository.findById(user.id);
      if (!userRecord || !userRecord.role_id) {
        return res.status(403).json({ error: "User has no role assigned" });
      }

      // Get role details
      const userRole = await roleRepository.findById(userRecord.role_id);
      if (!userRole) {
        return res.status(403).json({ error: "Role not found" });
      }

      // Check if user's role matches required roles
      const hasRole = roles.includes(userRole.name);

      if (!hasRole) {
        return res.status(403).json({
          error: "Insufficient role",
          required: roles,
          current: userRole.name,
        });
      }

      next();
    } catch (err) {
      console.error("Role check error:", err);
      res.status(500).json({ error: "Role check failed" });
    }
  };
}

/**
 * Middleware to attach user's permissions to request object
 * Useful for conditional behavior based on permissions
 */
export async function attachUserPermissions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      (req as any).userPermissions = [];
      return next();
    }

    const { userRepository, permissionRepository } = await getRepositories();

    // Get user's role
    const userRecord = await userRepository.findById(user.id);
    if (!userRecord || !userRecord.role_id) {
      (req as any).userPermissions = [];
      return next();
    }

    // Get user's permissions
    const permissions = await permissionRepository.getRolePermissions(
      userRecord.role_id,
    );
    (req as any).userPermissions = permissions.map(
      (p: { name: string }) => p.name,
    );
    (req as any).userRole = userRecord.role_id;

    next();
  } catch (err) {
    console.error("Error attaching permissions:", err);
    (req as any).userPermissions = [];
    next();
  }
}
