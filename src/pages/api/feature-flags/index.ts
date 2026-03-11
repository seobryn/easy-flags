/**
 * API Handler - Feature Flags
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse, badRequestResponse } from "@/utils/api";
import { FeatureFlagService } from "@application/services";
export const prerender = false;
export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const flagService = new FeatureFlagService();
    const { params } = context;
    const { environmentId, featureId } = params;

    if (environmentId) {
      // Get flags for environment
      const flags = await flagService.getEnvironmentFlags(
        parseInt(environmentId as string),
      );
      return new Response(JSON.stringify(flags), { status: 200 });
    } else if (featureId) {
      // Get flags for feature
      const flags = await flagService.getFeatureFlags(
        parseInt(featureId as string),
      );
      return new Response(JSON.stringify(flags), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
    });
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
    const flagService = new FeatureFlagService();
    const body = await context.request.json();
    const flag = await flagService.createFeatureFlag(
      body.feature_id,
      body.environment_id,
    );
    return new Response(JSON.stringify(flag), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
