import type { APIRoute } from "astro";
import { stripeClient } from "@/lib/stripeClient";

interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export const POST: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const user = await fetch("http://localhost:3001/api/auth/me", {
      headers: context.request.headers,
    }).then((res) => (res.ok ? res.json() : null));

    if (!user || !user.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = (await context.request.json()) as CheckoutRequest;
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Price ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || "http://localhost:3001/billing?success=true",
      cancel_url: cancelUrl || "http://localhost:3001/billing?canceled=true",
      customer_email: user.data.email,
      metadata: {
        userId: user.data.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create checkout session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
