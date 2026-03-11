/**
 * API Handler - Environments List
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { EnvironmentService, SpaceService } from "@application/services";

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
    const spaceId = parseInt(params.spaceId as string);

    // Verify space exists
    const spaceService = new SpaceService();
    const space = await spaceService.getSpace(spaceId);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    const environmentService = new EnvironmentService();
    const environments = await environmentService.getSpaceEnvironments(spaceId);
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
    const spaceId = parseInt(params.spaceId as string);

    // Verify space exists
    const spaceService = new SpaceService();
    const space = await spaceService.getSpace(spaceId);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    const environmentService = new EnvironmentService();
    const body = await context.request.json();
    const environment = await environmentService.createEnvironment(spaceId, {
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
