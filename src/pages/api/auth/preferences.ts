import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/utils/api";
import { getUserPreferences, updateUserPreferences } from "@/lib/auth-service";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);

    if (!user) {
      return new Response(JSON.stringify(errorResponse("Unauthorized", 401)), {
        status: 401,
      });
    }

    const preferences = await getUserPreferences(user.id);

    return new Response(
      JSON.stringify(successResponse(preferences)),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error
            ? error.message
            : "Failed to fetch preferences",
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

    const body = await context.request.json();
    const { email_notifications, security_alerts } = body;

    if (
      typeof email_notifications !== "boolean" &&
      typeof security_alerts !== "boolean"
    ) {
      return new Response(
        JSON.stringify(
          badRequestResponse("At least one preference must be provided"),
        ),
        { status: 400 },
      );
    }

    const preferences = await updateUserPreferences(user.id, {
      ...(typeof email_notifications === "boolean" && {
        email_notifications,
      }),
      ...(typeof security_alerts === "boolean" && { security_alerts }),
    });

    return new Response(
      JSON.stringify(successResponse(preferences)),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating preferences:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};
