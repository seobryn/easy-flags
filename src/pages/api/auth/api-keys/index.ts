import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { successResponse, errorResponse } from "@/utils/api";
import { getUserApiKeys, createUserApiKey } from "@/lib/auth-service";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);

    if (!user) {
      return new Response(JSON.stringify(errorResponse("Unauthorized", 401)), {
        status: 401,
      });
    }

    const apiKeys = await getUserApiKeys(user.id);

    return new Response(
      JSON.stringify(
        successResponse({
          data: apiKeys,
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to fetch API keys",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);

    if (!user) {
      return new Response(JSON.stringify(errorResponse("Unauthorized", 401)), {
        status: 401,
      });
    }

    const apiKey = await createUserApiKey(user.id);

    return new Response(
      JSON.stringify(
        successResponse({
          data: apiKey,
          message: "API key created successfully",
        }),
      ),
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to create API key",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};
