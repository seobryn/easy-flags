import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/utils/api";
import {
  updateUserPassword,
  comparePassword,
  getUserById,
} from "@/lib/auth-service";
import { getDatabase } from "@/lib/db";

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Current password and new password are required"),
        ),
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify(
          badRequestResponse("New password must be at least 6 characters"),
        ),
        { status: 400 },
      );
    }

    // Verify current password
    const db = await getDatabase();
    const userResult = await db.execute({
      sql: "SELECT password_hash FROM users WHERE id = ?",
      args: [user.id],
    });

    if (userResult.rows.length === 0) {
      return new Response(
        JSON.stringify(errorResponse("User not found", 404)),
        { status: 404 },
      );
    }

    const passwordHash = userResult.rows[0].password_hash as string;
    const isPasswordValid = await comparePassword(
      currentPassword,
      passwordHash,
    );

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify(errorResponse("Current password is incorrect", 401)),
        { status: 401 },
      );
    }

    await updateUserPassword(user.id, newPassword);

    return new Response(
      JSON.stringify(
        successResponse({
          message: "Password updated successfully",
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to update password",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};
