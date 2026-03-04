import express from "express";
import { EnvironmentService } from "../application/services/environmentService";
import { FeatureService } from "../application/services/featureService";
import { FlagQueryService } from "../application/services/flagQueryService";

export default function createFlagRouter(
  environmentService: EnvironmentService,
  featureService: FeatureService,
  flagQueryService: FlagQueryService,
) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const env = req.query.env as string | undefined;
    if (!env) {
      return res
        .status(400)
        .json({ error: "env query parameter required (name)" });
    }

    const flags = await flagQueryService.getFlagsByEnvironmentName(env);
    if (!flags) {
      return res.status(404).json({ error: "environment not found" });
    }

    res.json(flags);
  });

  router.get("/:env/:key", async (req, res) => {
    const envName = req.params.env as string | undefined;
    const key = req.params.key as string | undefined;

    if (!envName || !key) {
      return res
        .status(400)
        .json({ error: "env and key path parameters required" });
    }

    const environment = await environmentService.findByName(envName);
    if (!environment) {
      return res.status(404).json({ error: "environment not found" });
    }

    const feature = await featureService.findByKey(key);
    if (!feature) {
      return res.status(404).json({ error: "feature not found" });
    }

    const result = await flagQueryService.isFeatureEnabled(envName, key);
    if (!result) {
      return res.status(404).json({ error: "feature value not found" });
    }

    res.json(result);
  });

  return router;
}
