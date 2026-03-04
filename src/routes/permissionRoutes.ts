import express from "express";
import { PermissionService } from "../application/services/permissionService";

export default function createPermissionRouter(
  permissionService: PermissionService,
) {
  const router = express.Router();

  // List all permissions
  router.get("/", async (req, res) => {
    try {
      const permissions = await permissionService.listPermissions();
      res.json(permissions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create permission
  router.post("/", async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Permission name is required" });
      }
      await permissionService.createPermission(name, description);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update permission
  router.put("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Permission name is required" });
      }
      await permissionService.updatePermission(id, name, description);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete permission
  router.delete("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await permissionService.deletePermission(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get role permissions
  router.get("/role/:roleId", async (req, res) => {
    try {
      const roleId = Number(req.params.roleId);
      const permissions = await permissionService.getRolePermissions(roleId);
      res.json(permissions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
