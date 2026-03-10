import express from "express";
import { SpaceService } from "../application/services/spaceService";
import { EnvironmentService } from "../application/services/environmentService";
import { FeatureService } from "../application/services/featureService";
import { SpaceRepository } from "../infrastructure/repositories/spaceRepository";
import { EnvironmentRepository } from "../infrastructure/repositories/environmentRepository";
import { FeatureRepository } from "../infrastructure/repositories/featureRepository";
import { FeatureValueRepository } from "../infrastructure/repositories/featureValueRepository";
import {
  requireSpaceAccess,
  requireSpaceOwner,
} from "../authorizationMiddlewares";
import { asyncHandler } from "../utils/errorHandler";

export default function createSpaceRouter() {
  const router = express.Router();

  // Initialize services
  const spaceRepository = new SpaceRepository();
  const spaceService = new SpaceService(spaceRepository);

  const environmentRepository = new EnvironmentRepository();
  const featureRepository = new FeatureRepository();
  const featureValueRepository = new FeatureValueRepository();

  const environmentService = new EnvironmentService(
    environmentRepository,
    featureRepository,
    featureValueRepository,
  );
  const featureService = new FeatureService(
    featureRepository,
    featureValueRepository,
  );

  /**
   * POST /api/spaces
   * Create a new space
   * Body: { name: string, description?: string }
   */
  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const { name, description } = req.body;
      const user = (req as any).user;

      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Space name is required" });
      }

      const space = await spaceService.createSpace(name, user.id, description);
      res.status(201).json(space);
    }),
  );

  /**
   * GET /api/spaces
   * Get all spaces for the current user
   */
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const user = (req as any).user;

      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const spaces = await spaceService.getUserSpaces(user.id);
      res.json(spaces);
    }),
  );

  /**
   * GET /api/spaces/:spaceId
   * Get space details
   */
  router.get(
    "/:spaceId",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;

      const space = await spaceService.getSpaceById(Number(spaceId));
      if (!space) {
        return res.status(404).json({ error: "Space not found" });
      }

      res.json(space);
    }),
  );

  /**
   * PUT /api/spaces/:spaceId
   * Update space (name and description)
   * Only space owner can update
   */
  router.put(
    "/:spaceId",
    requireSpaceOwner(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;
      const { name, description } = req.body;
      const user = (req as any).user;

      try {
        const space = await spaceService.updateSpace(
          Number(spaceId),
          user.id,
          name,
          description,
        );
        res.json(space);
      } catch (error: any) {
        res.status(403).json({ error: error.message });
      }
    }),
  );

  /**
   * DELETE /api/spaces/:spaceId
   * Delete space (only owner can delete)
   */
  router.delete(
    "/:spaceId",
    requireSpaceOwner(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;
      const user = (req as any).user;

      try {
        const result = await spaceService.deleteSpace(Number(spaceId), user.id);
        res.json({ success: result });
      } catch (error: any) {
        res.status(403).json({ error: error.message });
      }
    }),
  );

  /**
   * POST /api/spaces/:spaceId/users
   * Add a user to the space
   * Body: { user_id: number, role_id: number }
   * Only space owner can add users
   */
  router.post(
    "/:spaceId/users",
    requireSpaceOwner(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;
      const { user_id, role_id } = req.body;
      const user = (req as any).user;

      if (!user_id || !role_id) {
        return res.status(400).json({
          error: "user_id and role_id are required",
        });
      }

      try {
        const spaceUser = await spaceService.addUserToSpace(
          Number(spaceId),
          user_id,
          role_id,
          user.id,
        );
        res.status(201).json(spaceUser);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * GET /api/spaces/:spaceId/users
   * Get all users in the space
   */
  router.get(
    "/:spaceId/users",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;
      const user = (req as any).user;

      try {
        const users = await spaceService.getSpaceUsers(
          Number(spaceId),
          user.id,
        );
        res.json(users);
      } catch (error: any) {
        res.status(403).json({ error: error.message });
      }
    }),
  );

  /**
   * PUT /api/spaces/:spaceId/users/:userId/role
   * Update user role in space
   * Body: { role_id: number }
   * Only space owner can update roles
   */
  router.put(
    "/:spaceId/users/:userId/role",
    requireSpaceOwner(),
    asyncHandler(async (req, res) => {
      const { spaceId, userId } = req.params;
      const { role_id } = req.body;
      const user = (req as any).user;

      if (!role_id) {
        return res.status(400).json({ error: "role_id is required" });
      }

      try {
        const spaceUser = await spaceService.updateUserRole(
          Number(spaceId),
          Number(userId),
          role_id,
          user.id,
        );
        res.json(spaceUser);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * DELETE /api/spaces/:spaceId/users/:userId
   * Remove user from space
   * Only space owner can remove users
   */
  router.delete(
    "/:spaceId/users/:userId",
    requireSpaceOwner(),
    asyncHandler(async (req, res) => {
      const { spaceId, userId } = req.params;
      const user = (req as any).user;

      try {
        const result = await spaceService.removeUserFromSpace(
          Number(spaceId),
          Number(userId),
          user.id,
        );
        res.json({ success: result });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * POST /api/spaces/:spaceId/environments
   * Create an environment in the space
   */
  router.post(
    "/:spaceId/environments",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Environment name is required" });
      }

      try {
        const env = await environmentService.createEnvironment(
          name,
          Number(spaceId),
        );
        res.status(201).json(env);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * GET /api/spaces/:spaceId/environments
   * List all environments in the space
   */
  router.get(
    "/:spaceId/environments",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;

      try {
        const envs = await environmentService.listEnvironmentsBySpace(
          Number(spaceId),
        );
        res.json(envs);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * DELETE /api/spaces/:spaceId/environments/:envId
   * Delete environment from space
   */
  router.delete(
    "/:spaceId/environments/:envId",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId, envId } = req.params;

      try {
        // Verify environment belongs to this space
        const env = await environmentRepository.findByIdAndSpaceId(
          Number(envId),
          Number(spaceId),
        );
        if (!env) {
          return res.status(404).json({
            error: "Environment not found in this space",
          });
        }

        const deleted = await environmentService.deleteEnvironment(
          Number(envId),
        );
        if (deleted) {
          return res.json({ success: true });
        }
        return res.status(404).json({ error: "Environment not found" });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * PUT /api/spaces/:spaceId/environments/:envId
   * Update environment name
   */
  router.put(
    "/:spaceId/environments/:envId",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId, envId } = req.params;
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Environment name is required" });
      }

      try {
        // Verify environment belongs to this space
        const env = await environmentRepository.findByIdAndSpaceId(
          Number(envId),
          Number(spaceId),
        );
        if (!env) {
          return res.status(404).json({
            error: "Environment not found in this space",
          });
        }

        const updated = await environmentService.updateEnvironmentName(
          Number(envId),
          name,
        );
        if (updated) {
          return res.json(updated);
        }
        return res.status(404).json({ error: "Environment not found" });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * POST /api/spaces/:spaceId/features
   * Create a feature in the space
   */
  router.post(
    "/:spaceId/features",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;
      const { key, description } = req.body;

      if (!key || key.trim().length === 0) {
        return res.status(400).json({ error: "Feature key is required" });
      }

      try {
        const feature = await featureService.createFeature(
          key,
          description,
          Number(spaceId),
        );
        res.status(201).json(feature);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * GET /api/spaces/:spaceId/features
   * List all features in the space
   */
  router.get(
    "/:spaceId/features",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId } = req.params;

      try {
        const features = await featureService.listFeaturesBySpace(
          Number(spaceId),
        );
        res.json(features);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * DELETE /api/spaces/:spaceId/features/:featureId
   * Delete feature from space
   */
  router.delete(
    "/:spaceId/features/:featureId",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId, featureId } = req.params;

      try {
        // Verify feature belongs to this space
        const feature = await featureRepository.findByIdAndSpaceId(
          Number(featureId),
          Number(spaceId),
        );
        if (!feature) {
          return res
            .status(404)
            .json({ error: "Feature not found in this space" });
        }

        const deleted = await featureService.deleteFeature(Number(featureId));
        if (deleted) {
          return res.json({ success: true });
        }
        return res.status(404).json({ error: "Feature not found" });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  /**
   * PUT /api/spaces/:spaceId/features/:featureId/value
   * Set feature flag value for an environment
   */
  router.put(
    "/:spaceId/features/:featureId/value",
    requireSpaceAccess(),
    asyncHandler(async (req, res) => {
      const { spaceId, featureId } = req.params;
      const { environmentId, value } = req.body;

      if (environmentId === undefined || value === undefined) {
        return res.status(400).json({
          error: "environmentId and value are required",
        });
      }

      try {
        // Verify feature belongs to this space
        const feature = await featureRepository.findByIdAndSpaceId(
          Number(featureId),
          Number(spaceId),
        );
        if (!feature) {
          return res
            .status(404)
            .json({ error: "Feature not found in this space" });
        }

        // Verify environment belongs to this space
        const env = await environmentRepository.findByIdAndSpaceId(
          environmentId,
          Number(spaceId),
        );
        if (!env) {
          return res.status(404).json({
            error: "Environment not found in this space",
          });
        }

        const fv = await featureValueRepository.upsertWithSpaceValidation(
          Number(featureId),
          environmentId,
          Number(spaceId),
          value,
        );
        res.json(fv);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }),
  );

  return router;
}
