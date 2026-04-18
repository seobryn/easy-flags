import type { APIRoute } from "astro";
import { verifyUserAccount } from "@/lib/auth-service";
import { successResponse, badRequestResponse } from "@/utils/api";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify(badRequestResponse("Verification token is missing")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const user = await verifyUserAccount(token);
    
    return new Response(
      JSON.stringify(successResponse({
        message: "Account verified successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      })),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify(badRequestResponse(error instanceof Error ? error.message : "Verification failed")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
