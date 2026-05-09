import type { APIRoute } from "astro";
import { updateUserPassword } from "@/lib/auth-service";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/utils/api";
import { getDatabase } from "@/lib/db";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { token, newPassword } = await context.request.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Token and new password are required"),
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

    // Validate token and get user
    const db = await getDatabase();
    const tokenResult = await db.execute({
      sql: `
        SELECT prt.user_id, prt.expires_at, prt.used_at
        FROM password_reset_tokens prt
        WHERE prt.token = ?
      `,
      args: [token],
    });

    if (tokenResult.rows.length === 0) {
      return new Response(
        JSON.stringify(
          errorResponse("Invalid or expired reset token", 400),
        ),
        { status: 400 },
      );
    }

    const row = tokenResult.rows[0];
    const expiresAt = new Date(row.expires_at as string);
    const usedAt = row.used_at ? new Date(row.used_at as string) : null;

    // Check if token is expired
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify(
          errorResponse("Reset token has expired", 400),
        ),
        { status: 400 },
      );
    }

    // Check if token is already used
    if (usedAt) {
      return new Response(
        JSON.stringify(
          errorResponse("Reset token has already been used", 400),
        ),
        { status: 400 },
      );
    }

    const userId = row.user_id as number;

    // Update password
    await updateUserPassword(userId, newPassword);

    // Mark token as used
    await db.execute({
      sql: "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?",
      args: [token],
    });

    return new Response(
      JSON.stringify(
        successResponse({
          message: "Password has been reset successfully. You can now log in with your new password.",
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in reset password:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to reset password",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};