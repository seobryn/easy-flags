/**
 * API Handler - Environments List
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse, badRequestResponse } from "@/utils/api";
import { EnvironmentService, SpaceService, LimitService } from "@application/services";

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

    const environmentService = new EnvironmentService();
    const environments = await environmentService.getSpaceEnvironments(
      space.id,
    );
    return new Response(JSON.stringify(environments), { status: 200 });
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

    const environmentService = new EnvironmentService();
    const body = await context.request.json();

    // Check limit before creating
    const limitCheck = await limitService.checkLimit(space.id, "max_environments");
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify(badRequestResponse(limitCheck.error || "Environment limit reached")),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const environment = await environmentService.createEnvironment(space.id, {
      name: body.name,
      description: body.description,
      type: body.type || "other",
    });
    return new Response(JSON.stringify(environment), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
