import express from "express";
import { FeatureService } from "../application/services/featureService";

export default function createFeatureRouter(featureService: FeatureService) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const rows = await featureService.listFeatures();
    res.json(rows);
  });

  router.post("/", async (req, res) => {
    const { key, description } = req.body;
    if (!key) return res.status(400).json({ error: "key required" });
    if (/\s/.test(key)) {
      return res.status(400).json({ error: "key cannot contain spaces" });
    }
    try {
      const feature = await featureService.createFeature(key, description);
      res.status(201).json(feature);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      const deleted = await featureService.deleteFeature(id);
      if (deleted) return res.json({ success: true });
      return res.status(404).json({ error: "Feature not found" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put("/:id/value", async (req, res) => {
    const featureId = Number(req.params.id);
    const { environmentId, value } = req.body;
    if (!environmentId || typeof value !== "boolean") {
      return res
        .status(400)
        .json({ error: "environmentId and boolean value required" });
    }
    try {
      const fv = await featureService.setFeatureValue(
        featureId,
        environmentId,
        value,
      );
      res.json(fv);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
