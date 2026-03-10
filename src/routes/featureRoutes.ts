import express from "express";
import { FeatureService } from "../application/services/featureService";
import { asyncHandler } from "../utils/errorHandler";
import {
  validateFeatureInput,
  validateFeatureValueInput,
} from "../utils/validators";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/constants";
import { ok, created, fail } from "../utils/apiResponse";

export default function createFeatureRouter(featureService: FeatureService) {
  const router = express.Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const rows = await featureService.listFeatures();
      res.json(ok(rows));
    }),
  );

  router.post(
    "/",
    validateFeatureInput,
    asyncHandler(async (req, res) => {
      const { key, description, spaceId } = req.body;

      // Enforce space requirement
      if (!spaceId) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(
            fail(
              "SPACE_REQUIRED",
              "spaceId is required. All features must belong to a space. Please use the space-scoped endpoint: POST /api/spaces/:spaceId/features",
            ),
          );
      }

      const feature = await featureService.createFeature(
        key,
        description,
        spaceId,
      );
      res.status(HTTP_STATUS.CREATED).json(created(feature));
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const deleted = await featureService.deleteFeature(id);
      if (deleted) return res.json(ok({}));
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(fail("FEATURE_NOT_FOUND", ERROR_MESSAGES.FEATURE_NOT_FOUND));
    }),
  );

  router.put(
    "/:id/value",
    validateFeatureValueInput,
    asyncHandler(async (req, res) => {
      const featureId = Number(req.params.id);
      const { environmentId, value } = req.body;
      const fv = await featureService.setFeatureValue(
        featureId,
        environmentId,
        value,
      );
      res.json(ok(fv));
    }),
  );

  return router;
}
