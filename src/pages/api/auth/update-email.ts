import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/utils/api";
import { updateUserEmail, getUserByEmail } from "@/lib/auth-service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);

    if (!user) {
      return new Response(JSON.stringify(errorResponse("Unauthorized", 401)), {
        status: 401,
      });
    }

    const body = await context.request.json();
    const { email } = body;

    if (!email || email.trim() === "") {
      return new Response(
        JSON.stringify(badRequestResponse("Email is required")),
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify(badRequestResponse("Invalid email format")),
        { status: 400 },
      );
    }

    // Check if email is already in use
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return new Response(
        JSON.stringify(errorResponse("Email already in use", 409)),
        { status: 409 },
      );
    }

    await updateUserEmail(user.id, email);

    return new Response(
      JSON.stringify(
        successResponse({
          message: "Email updated successfully",
          email,
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating email:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to update email",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};
