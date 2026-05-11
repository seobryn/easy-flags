import type { APIRoute } from "astro";
import { getUserFromContextWithVersionCheck, isSuperUser } from "@/utils/auth";
import { revokeUserTokens, getUserById } from "@/lib/auth-service";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
} from "@/utils/api";

export const prerender = false;

/**
 * Revoke all tokens for a specific user
 * Restricted to super users only (role_id = 1)
 * POST /api/auth/revoke-user-tokens
 * Body: { userId: number }
 */
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication (including token_version check to detect revoked tokens)
    const user = await getUserFromContextWithVersionCheck(context);
    if (!user) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
      });
    }

    // Check super user privileges (role_id = 1 only)
    if (!isSuperUser(user)) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Only super users can revoke user tokens. This action requires super user privileges.",
        }),
        { status: 403 },
      );
    }

    // Parse request body
    const body = await context.request.json().catch(() => ({}));
    const targetUserId = body.userId;

    if (!targetUserId || typeof targetUserId !== "number") {
      return new Response(
        JSON.stringify(
          badRequestResponse("userId is required and must be a number"),
        ),
        { status: 400 },
      );
    }

    // Check if target user exists
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return new Response(JSON.stringify(notFoundResponse()), {
        status: 404,
      });
    }

    // Revoke all tokens
    await revokeUserTokens(targetUserId);

    return new Response(
      JSON.stringify(
        successResponse({
          message: `All tokens revoked for user: ${targetUser.username}`,
          userId: targetUserId,
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error revoking user tokens:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to revoke tokens",
      }),
      { status: 500 },
    );
  }
};
