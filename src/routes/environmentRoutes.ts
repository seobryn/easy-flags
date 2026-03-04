import express from "express";
import { EnvironmentService } from "../application/services/environmentService";

export default function createEnvironmentRouter(
  environmentService: EnvironmentService,
) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const rows = await environmentService.listEnvironments();
    res.json(rows);
  });

  router.post("/", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    try {
      const env = await environmentService.createEnvironment(name);
      res.status(201).json(env);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      const deleted = await environmentService.deleteEnvironment(id);
      if (deleted) return res.json({ success: true });
      return res.status(404).json({ error: "Environment not found" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put("/:id", async (req, res) => {
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
  });

  return router;
}
