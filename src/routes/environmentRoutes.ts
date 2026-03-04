import express from "express";
import { EnvironmentService } from "../application/services/environmentService";
import { requirePermission } from "../authorizationMiddlewares";

export default function createEnvironmentRouter(
  environmentService: EnvironmentService,
) {
  const router = express.Router();

  // List environments
  router.get("/", requirePermission("view_environments"), async (req, res) => {
    const rows = await environmentService.listEnvironments();
    res.json(rows);
  });

  // Create environment
  router.post(
    "/",
    requirePermission("create_environments"),
    async (req, res) => {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      try {
        const env = await environmentService.createEnvironment(name);
        res.status(201).json(env);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  // Delete environment
  router.delete(
    "/:id",
    requirePermission("delete_environments"),
    async (req, res) => {
      const id = Number(req.params.id);
      try {
        const deleted = await environmentService.deleteEnvironment(id);
        if (deleted) return res.json({ success: true });
        return res.status(404).json({ error: "Environment not found" });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  // Update environment
  router.put(
    "/:id",
    requirePermission("update_environments"),
    async (req, res) => {
      const id = Number(req.params.id);
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      try {
        const env = await environmentService.updateEnvironmentName(id, name);
        if (env) return res.json(env);
        return res.status(404).json({ error: "Environment not found" });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  return router;
}
