/**
 * API Handler - Features
 */

import type { APIRoute } from "astro";
import { unauthorizedResponse, badRequestResponse } from "@/utils/api";
import { SpaceService, FeatureService, LimitService } from "@application/services";

const limitService = LimitService.getInstance();

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const { params } = context;
    const spaceSlug = params.spaceId as string;

    // Verify space exists
    const spaceService = new SpaceService();
    const space = await spaceService.getSpaceBySlug(spaceSlug);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    const featureService = new FeatureService();
    const features = await featureService.getSpaceFeatures(space.id);
    return new Response(JSON.stringify(features), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const { params } = context;
    const spaceSlug = params.spaceId as string;

    // Verify space exists
    const spaceService = new SpaceService();
    const space = await spaceService.getSpaceBySlug(spaceSlug);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    const featureService = new FeatureService();
    const body = await context.request.json();

    // Check limit before creating
    const limitCheck = await limitService.checkLimit(space.id, "max_flags");
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify(badRequestResponse(limitCheck.error || "Flag limit reached")),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const feature = await featureService.createFeature(space.id, {
      key: body.key,
      name: body.name,
      description: body.description,
      type: body.type || "boolean",
      default_value: body.default_value || "false",
    });
    return new Response(JSON.stringify(feature), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
