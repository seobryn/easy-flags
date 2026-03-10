import type { APIRoute } from "astro";
import { setAuthCookie, signToken } from "@/utils/auth";
import { successResponse, badRequestResponse } from "@/utils/api";

// This is a placeholder - in a real implementation,
// we would use the database repositories from the Express app
// For now, this demonstrates the structure

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify(badRequestResponse("Email and password are required")),
        { status: 400 },
      );
    }

    // TODO: Validate credentials against database
    // For demo purposes, we'll accept any email/password combination
    // In production, use the UserRepository and AuthService
    const user = {
      id: 1,
      username: email.split("@")[0],
      email,
      role_id: 1,
    };

    const token = signToken(user);
    setAuthCookie(context, token);

    return new Response(
      JSON.stringify(
        successResponse({
          user,
          token,
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Invalid email or password")),
      { status: 400 },
    );
  }
};
