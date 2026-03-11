/**
 * API Handler - Spaces
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse, badRequestResponse } from "@/utils/api";
import { checkSpaceAdminAuth } from "@/utils/permissions";
import { SpaceService } from "@application/services";
import { getRepositoryRegistry } from "@infrastructure/registry";
import { getDatabase } from "@lib/db";

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
    const spaceService = new SpaceService();

    if (params.id) {
      // Get single space - verify user has access
      const spaceId = parseInt(params.id as string);
      const { isAuthorized } = await checkSpaceAdminAuth(context, spaceId);

      // For GET, allow any member to view the space (viewers should only be read)
      // TODO: Implement full space access check for viewers

      const space = await spaceService.getSpace(spaceId);
      if (!space) {
        return new Response(JSON.stringify({ error: "Space not found" }), {
          status: 404,
        });
      }
      return new Response(JSON.stringify(space), { status: 200 });
    } else {
      // Get all spaces
      const spaces = await spaceService.getAllSpaces();
      return new Response(JSON.stringify(spaces), { status: 200 });
    }
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
    const spaceService = new SpaceService();
    const body = await context.request.json();

    if (!body.name) {
      return new Response(
        JSON.stringify(badRequestResponse("Space name is required")),
        { status: 400 },
      );
    }

    const space = await spaceService.createSpace(user.id, {
      name: body.name,
      description: body.description || "",
    });

    return new Response(JSON.stringify(space), { status: 201 });
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

  const { params } = context;
  try {
    const spaceId = parseInt(params.id as string);

    // Only space admins can update
    const { isAuthorized } = await checkSpaceAdminAuth(context, spaceId);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions to update this space",
        }),
        { status: 403 },
      );
    }

    const spaceService = new SpaceService();
    const body = await context.request.json();

    const space = await spaceService.updateSpace(spaceId, {
      name: body.name,
      description: body.description,
    });

    return new Response(JSON.stringify(space), { status: 200 });
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

  const { params } = context;
  try {
    const spaceId = parseInt(params.id as string);

    // Only space admins can delete
    const { isAuthorized } = await checkSpaceAdminAuth(context, spaceId);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions to delete this space",
        }),
        { status: 403 },
      );
    }

    const spaceService = new SpaceService();
    await spaceService.deleteSpace(spaceId);

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
