import type { APIRoute } from "astro";
import {
  successResponse,
  errorResponse,
} from "@/utils/api";
import { getDatabase } from "@/lib/db";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const { token } = context.params;

    if (!token) {
      return new Response(
        JSON.stringify(
          errorResponse("Token is required", 400),
        ),
        { status: 400 },
      );
    }

    // Validate token
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

    return new Response(
      JSON.stringify(
        successResponse({
          valid: true,
          message: "Token is valid",
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error validating reset token:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to validate token",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};