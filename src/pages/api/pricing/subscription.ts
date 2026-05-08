import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/utils/api";
import { PricingService } from "@application/services";

export const prerender = false;

// GET /api/pricing/subscription - Get subscription for the current user
export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const pricingService = PricingService.getInstance();
    const subscription = await pricingService.getUserSubscription(user.id);

    return new Response(JSON.stringify(successResponse(subscription)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Failed to fetch subscription")),
      { status: 400 },
    );
  }
};
