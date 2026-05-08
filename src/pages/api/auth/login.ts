import type { APIRoute } from "astro";
import { setAuthCookie, signToken } from "@/utils/auth";
import { successResponse, badRequestResponse } from "@/utils/api";
import { getSafeRedirectUrl } from "@/utils/redirect";
import { verifyCredentials } from "@/lib/auth-service";
import { validateBody, authSchemas, validationErrorResponse } from "@/lib/validation";
import {
  checkRateLimit,
  getRateLimitConfig,
  getClientIdentifier,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

// Prevent static pre-rendering for this API route
export const prerender = false;

export const POST: APIRoute = async (context) => {
  const clientId = getClientIdentifier(context.request, "auth");
  const config = getRateLimitConfig("auth");
  const rateLimit = checkRateLimit(clientId, config);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify(badRequestResponse("Too many requests. Please try again later.")),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
        },
      },
    );
  }

  try {
    console.log("🔍 login.ts - Received request");
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
      console.log("🔤 Body trimmed:", text.trim());
      console.log("✔ Body is empty?", !text || text.trim() === "");

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

    const { username, password, redirectUrl } = body;

    const validation = validateBody(body, authSchemas.login);
    if (validation) {
      return validationErrorResponse(validation.errors);
    }

    // Validate and sanitize redirect URL
    const sanitizedRedirectUrl = getSafeRedirectUrl(redirectUrl);

    // Verify credentials against database
    const user = await verifyCredentials(username, password);

    if (!user) {
      console.warn(`Failed login attempt for username: ${username}`);
      return new Response(
        JSON.stringify(badRequestResponse("Invalid username or password")),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
          },
        },
      );
    }

    // Create authentication token
    const token = signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      token_version: user.token_version,
    });

    // Set authentication cookie
    setAuthCookie(context, token);

    console.log(`✅ Login successful for user: ${username} (ID: ${user.id})`);

return new Response(
        JSON.stringify(
          successResponse({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role_id: user.role_id,
            },
            token,
            redirectUrl: sanitizedRedirectUrl,
          }),
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
          },
        },
      );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Login failed";
    
    if (errorMessage === "ACCOUNT_NOT_VERIFIED") {
      return new Response(
        JSON.stringify(badRequestResponse("Account verification required. Please check your email.", "ACCOUNT_NOT_VERIFIED")),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(
        badRequestResponse(
          error instanceof Error
            ? `Login failed: ${error.message}`
            : "Login failed. Please try again.",
        ),
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
