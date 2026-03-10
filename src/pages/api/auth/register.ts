import type { APIRoute } from "astro";
import { setAuthCookie, signToken } from "@/utils/auth";
import { successResponse, badRequestResponse } from "@/utils/api";

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Username, email, and password are required"),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (username.trim() === "" || email.trim() === "" || password.trim() === "") {
      return new Response(
        JSON.stringify(
          badRequestResponse("Username, email, and password cannot be empty"),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // TODO: Validate and create user in database
    // For demo purposes, we'll accept any input
    // In production, use the UserRepository and AuthService
    const user = {
      id: Math.floor(Math.random() * 1000000),
      username,
      email,
      role_id: 2, // Default role
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
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Registration failed")),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
};
