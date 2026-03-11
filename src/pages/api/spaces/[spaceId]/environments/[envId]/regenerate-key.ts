/**
 * API Handler - Regenerate Environment API Key
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { EnvironmentService, SpaceService } from "@application/services";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const spaceService = new SpaceService();
    const environmentService = new EnvironmentService();

    const spaceSlug = context.params.spaceId as string;
    const envId = parseInt(context.params.envId as string);

    // Verify space exists
    const space = await spaceService.getSpaceBySlug(spaceSlug);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    // Verify environment exists and belongs to space
    const environment = await environmentService.getEnvironment(envId);
    if (!environment || environment.space_id !== space.id) {
      return new Response(JSON.stringify({ error: "Environment not found" }), {
        status: 404,
      });
    }

    const updatedEnvironment = await environmentService.regenerateApiKey(envId);

    return new Response(JSON.stringify(updatedEnvironment), { status: 200 });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
