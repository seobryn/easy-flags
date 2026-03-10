import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { successResponse, unauthorizedResponse } from "@/utils/api";

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  return new Response(JSON.stringify(successResponse(user)), { status: 200 });
};
