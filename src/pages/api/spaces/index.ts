import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/utils/api";

// This is a placeholder - in production, you would:
// 1. Import the SpaceRepository and SpaceService from the Express app
// 2. Use the database connection to fetch/create spaces
// For now, we're returning mock data

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  // TODO: Use SpaceRepository to fetch user's spaces
  // For demo, returning mock data
  const mockSpaces = [
    {
      id: 1,
      name: "Production",
      description: "Production environment",
      owner_id: user.id,
      members_count: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Staging",
      description: "Staging environment",
      owner_id: user.id,
      members_count: 3,
      created_at: new Date().toISOString(),
    },
  ];

  return new Response(JSON.stringify(successResponse(mockSpaces)), {
    status: 200,
  });
};

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const body = await context.request.json();
    const { name, description } = body;

    if (!name) {
      return new Response(
        JSON.stringify(badRequestResponse("Space name is required")),
        { status: 400 },
      );
    }

    // TODO: Use SpaceService to create new space
    // For demo, creating mock space
    const newSpace = {
      id: Math.floor(Math.random() * 1000),
      name,
      description: description || "",
      owner_id: user.id,
      members_count: 1,
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(successResponse(newSpace)), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating space:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Failed to create space")),
      { status: 400 },
    );
  }
};
