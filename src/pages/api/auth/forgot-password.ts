import type { APIRoute } from "astro";
import { getUserByEmail } from "@/lib/auth-service";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/utils/api";
import { getDatabase } from "@/lib/db";
import { EmailService } from "@/application/services";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { email } = await context.request.json();

    if (!email) {
      return new Response(
        JSON.stringify(
          badRequestResponse("Email is required"),
        ),
        { status: 400 },
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal that the email doesn't exist - return success anyway for security
      return new Response(
        JSON.stringify(
          successResponse({
            message: "If an account exists with that email, you will receive a password reset link.",
          }),
        ),
        { status: 200 },
      );
    }

    if (!user.is_active) {
      return new Response(
        JSON.stringify(
          successResponse({
            message: "If an account exists with that email, you will receive a password reset link.",
          }),
        ),
        { status: 200 },
      );
    }

    // Generate reset token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token in database
    const db = await getDatabase();
    await db.execute({
      sql: `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `,
      args: [user.id, token, expiresAt.toISOString()],
    });

    // Send email
    try {
      const emailService = EmailService.getInstance();
      await emailService.sendPasswordResetEmail(user.email, user.username, token);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Continue anyway - we don't want to fail the request if email fails
      // In production, we might want to queue this or retry
    }

    return new Response(
      JSON.stringify(
        successResponse({
          message: "If an account exists with that email, you will receive a password reset link.",
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return new Response(
      JSON.stringify(
        errorResponse(
          error instanceof Error ? error.message : "Failed to process request",
          500,
        ),
      ),
      { status: 500 },
    );
  }
};