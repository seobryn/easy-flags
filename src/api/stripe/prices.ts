import type { APIRoute } from "astro";
import { stripeClient } from "@/lib/stripeClient";

export const GET: APIRoute = async (context) => {
  try {
    const prices = await stripeClient.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });

    const mapped = prices.data.map((p: any) => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval || null,
      product:
        p.product && typeof p.product === "object"
          ? {
              id: p.product.id,
              name: p.product.name,
              description: p.product.description,
            }
          : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: mapped,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error fetching Stripe prices:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch prices",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
