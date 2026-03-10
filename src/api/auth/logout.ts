import type { APIRoute } from "astro";
import { clearAuthCookie } from "@/utils/auth";
import { successResponse } from "@/utils/api";

export const POST: APIRoute = async (context) => {
  clearAuthCookie(context);
  return new Response(
    JSON.stringify(successResponse({ message: "Logged out successfully" })),
    { status: 200 },
  );
};
