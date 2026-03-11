import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { successResponse, errorResponse } from "@/utils/api";
import { deleteUserApiKey } from "@/lib/auth-service";

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);

    if (!user) {
      return new Response(JSON.stringify(errorResponse("Unauthorized", 401)), {
        status: 401,
      });
    }

    const id = context.params.id;
    if (!id) {
      return new Response(
        JSON.stringify(errorResponse("API Key ID is required", 400)),
        { status: 400 },
      );
    }

    const keyId = parseInt(id, 10);
    if (isNaN(keyId)) {
      return new Response(
        JSON.stringify(errorResponse("Invalid API Key ID", 400)),
        { status: 400 },
      );
    }

    await deleteUserApiKey(user.id, keyId);

    return new Response(
      JSON.stringify(
        successResponse({
          message: "API key deleted successfully",
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting API key:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to delete API key",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};
