/**
 * API Handler - Feature Flag Details
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { FeatureFlagService } from "@application/services";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  const { params } = context;
  try {
    const flagService = new FeatureFlagService();
    const flagId = parseInt(params.flagId as string);
    const flag = await flagService.getFeatureFlag(flagId);
    if (!flag) {
      return new Response(JSON.stringify({ error: "Feature flag not found" }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify(flag), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};

export const PUT: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const flagService = new FeatureFlagService();
    const { params } = context;
    const body = await context.request.json();
    const flagId = parseInt(params.flagId as string);
    const flag = await flagService.updateFeatureFlag(flagId, {
      is_enabled: body.is_enabled,
      rollout_percentage: body.rollout_percentage,
      value: body.value,
    });
    return new Response(JSON.stringify(flag), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const flagService = new FeatureFlagService();
    const { params } = context;
    const flagId = parseInt(params.flagId as string);
    await flagService.deleteFeatureFlag(flagId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
