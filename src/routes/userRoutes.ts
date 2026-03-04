import express from "express";
import { UserService } from "../application/services/userService";

export default function createUserRouter(userService: UserService) {
  const router = express.Router();

  // List users with roles
  router.get("/", async (req, res) => {
    try {
      const users = await userService.listUsersWithRoles();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create user
  router.post("/", async (req, res) => {
    const { username, password, roleId } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });
    try {
      await userService.createUser(username, password, roleId);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get single user
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const u = await userService.findUser(id);
    if (!u) return res.status(404).json({ error: "user not found" });
    res.json(u);
  });

  // Update user
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });
    try {
      await userService.updateUser(id, username, password);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Assign role to user
  router.post("/:id/role/:roleId", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const roleId = Number(req.params.roleId);
      await userService.assignRoleToUser(userId, roleId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Remove role from user
  router.delete("/:id/role", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      await userService.removeRoleFromUser(userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete user
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      await userService.deleteUser(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
