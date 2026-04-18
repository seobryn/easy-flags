import type { APIRoute } from "astro";
import { setAuthCookie, signToken } from "@/utils/auth";
import { successResponse, badRequestResponse } from "@/utils/api";
import { createUser } from "@/lib/auth-service";

// Prevent static pre-rendering for this API route
export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    console.log("🔍 register.ts - Received request");
    console.log(
      "📋 Content-Type:",
      context.request.headers.get("content-type"),
    );
    console.log("📦 Method:", context.request.method);

    let body;
    try {
      // Clone the request to avoid consuming the stream
      const clonedRequest = context.request.clone();
      const text = await clonedRequest.text();
      console.log("📝 Raw body text:", text);
      console.log("📐 Body length:", text.length);

      if (!text || text.trim() === "") {
        console.error("❌ Empty request body");
        return new Response(
          JSON.stringify(badRequestResponse("Request body cannot be empty")),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      body = JSON.parse(text);
      console.log("✅ Parsed body:", body);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify(
          badRequestResponse("Invalid request format. Please send valid JSON."),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { username, email, password } = body;

    if (!username || !email || !password) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Username, email, and password are required"),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (
      username.trim() === "" ||
      email.trim() === "" ||
      password.trim() === ""
    ) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Username, email, and password cannot be empty"),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify(badRequestResponse("Invalid email format")),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create user in database
    const user = await createUser(username, email, password, 2); // 2 = editor role

    console.log(
      `✅ Registration successful for user: ${username} (ID: ${user.id}). Verification email sent.`,
    );

    return new Response(
      JSON.stringify(
        successResponse({
          message: "Registration successful. Please check your email to verify your account.",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role_id: user.role_id,
          },
        }),
      ),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Registration error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    );

    // Check for specific error messages
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    const isDuplicateError =
      errorMessage.includes("already exists") ||
      errorMessage.includes("UNIQUE");

    return new Response(JSON.stringify(badRequestResponse(errorMessage)), {
      status: isDuplicateError ? 409 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
