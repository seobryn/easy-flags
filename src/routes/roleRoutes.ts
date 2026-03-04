import express from "express";
import { RoleService } from "../application/services/roleService";
import { PermissionService } from "../application/services/permissionService";

export default function createRoleRouter(
  roleService: RoleService,
  permissionService: PermissionService,
) {
  const router = express.Router();

  // List all roles
  router.get("/", async (req, res) => {
    try {
      const roles = await roleService.listRoles();
      res.json(roles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get role with permissions
  router.get("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const role = await roleService.getRoleWithPermissions(id);
      if (!role) return res.status(404).json({ error: "Role not found" });
      res.json(role);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create role
  router.post("/", async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Role name is required" });
      }
      await roleService.createRole(name, description);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update role
  router.put("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Role name is required" });
      }
      await roleService.updateRole(id, name, description);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete role
  router.delete("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await roleService.deleteRole(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Set role permissions
  router.post("/:id/permissions", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        return res
          .status(400)
          .json({ error: "permissionIds must be an array" });
      }

      await roleService.setRolePermissions(id, permissionIds);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Assign single permission to role
  router.post("/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const roleId = Number(req.params.roleId);
      const permissionId = Number(req.params.permissionId);
      await roleService.assignPermissionToRole(roleId, permissionId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Remove permission from role
  router.delete("/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const roleId = Number(req.params.roleId);
      const permissionId = Number(req.params.permissionId);
      await roleService.removePermissionFromRole(roleId, permissionId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
