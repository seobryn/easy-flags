import type { APIRoute } from "astro";
import { stripeClient } from "@/lib/stripeClient";
import type { Stripe } from "stripe";

export const POST: APIRoute = async (context) => {
  const sig = context.request.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!webhookSecret) {
    console.warn(
      "STRIPE_WEBHOOK_SECRET not set; webhook verification disabled",
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: "Webhook secret not configured",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await context.request.text();

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        sig,
        webhookSecret,
      ) as Stripe.Event;
    } catch (err: any) {
      console.error(
        "Stripe webhook signature verification failed:",
        err.message,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `Webhook Error: ${err.message}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);
        // TODO: Update user subscription in database
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);
        // TODO: Update subscription status in database
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);
        // TODO: Update subscription status to canceled in database
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error handling Stripe webhook:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
