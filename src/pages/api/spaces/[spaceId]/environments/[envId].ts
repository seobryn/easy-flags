/**
 * API Handler - Single Environment
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { EnvironmentService } from "@application/services";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const environmentService = new EnvironmentService();
    const envId = parseInt(context.params.envId as string);
    const environment = await environmentService.getEnvironment(envId);
    if (!environment) {
      return new Response(JSON.stringify({ error: "Environment not found" }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify(environment), { status: 200 });
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
    const environmentService = new EnvironmentService();
    const body = await context.request.json();
    const envId = parseInt(context.params.envId as string);
    const environment = await environmentService.updateEnvironment(envId, {
      name: body.name,
      description: body.description,
    });
    return new Response(JSON.stringify(environment), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};

export const PATCH: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const environmentService = new EnvironmentService();
    const body = await context.request.json();
    const envId = parseInt(context.params.envId as string);
    const environment = await environmentService.updateEnvironment(envId, {
      name: body.name,
      description: body.description,
    });
    return new Response(JSON.stringify(environment), { status: 200 });
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
    const environmentService = new EnvironmentService();
    const envId = parseInt(context.params.envId as string);
    await environmentService.deleteEnvironment(envId);
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
