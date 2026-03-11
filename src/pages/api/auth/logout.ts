import type { APIRoute } from "astro";
import { clearAuthCookie, getUserFromContext } from "@/utils/auth";
import { successResponse, unauthorizedResponse } from "@/utils/api";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  clearAuthCookie(context);
  return new Response(
    JSON.stringify(successResponse({ message: "Logged out successfully" })),
    { status: 200 },
  );
};
