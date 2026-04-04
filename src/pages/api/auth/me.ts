import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { getUserById } from "@/lib/auth-service";
import { successResponse, unauthorizedResponse } from "@/utils/api";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const payload = getUserFromContext(context);

  if (!payload) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  // Fetch full user data from database to include created_at, role_id, etc.
  const user = await getUserById(payload.id);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  return new Response(JSON.stringify(successResponse(user)), { status: 200 });
};
