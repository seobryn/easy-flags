import type { APIRoute } from "astro";
import {
  clearAuthCookie,
  clearRefreshTokenCookie,
  getUserFromContext,
} from "@/utils/auth";
import { revokeUserTokens } from "@/lib/auth-service";
import { revokeAllRefreshTokens } from "@/utils/auth";
import { successResponse, unauthorizedResponse } from "@/utils/api";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  await revokeUserTokens(user.id);
  await revokeAllRefreshTokens(user.id);

  clearAuthCookie(context);
  clearRefreshTokenCookie(context);

  return new Response(
    JSON.stringify(
      successResponse({
        message: "Logged out successfully. All sessions revoked.",
      }),
    ),
    { status: 200 },
  );
};
