import type { APIRoute } from "astro";
import { setAuthCookie, signToken } from "@/utils/auth";
import { successResponse, badRequestResponse } from "@/utils/api";

// This is a placeholder - in a real implementation,
// we would use the database repositories from the Express app
// For now, this demonstrates the structure

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Username and password are required"),
        ),
        { status: 400 },
      );
    }

    // TODO: Validate credentials against database
    // For demo purposes, we'll accept any non-empty username/password combination
    // In production, use the UserRepository and AuthService

    if (username.trim() === "" || password.trim() === "") {
      return new Response(
        JSON.stringify(
          badRequestResponse("Username and password cannot be empty"),
        ),
        { status: 400 },
      );
    }

    const user = {
      id: Math.random(),
      username,
      email: `${username}@example.com`,
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
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Invalid request. Please try again.")),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
};
