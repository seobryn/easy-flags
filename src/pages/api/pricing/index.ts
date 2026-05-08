import type { APIRoute } from "astro";
import { successResponse, badRequestResponse } from "@/utils/api";
import { PricingService } from "@application/services";

export const prerender = false;

// GET /api/pricing - Get all active pricing plans with features and limits
export const GET: APIRoute = async () => {
  try {
    const pricingService = PricingService.getInstance();
    const plans = await pricingService.getAllPricingPlans();

    return new Response(JSON.stringify(successResponse(plans)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Failed to fetch pricing plans")),
      { status: 400 },
    );
  }
};

// POST /api/pricing - Initialize default pricing plans (if not already initialized)
export const POST: APIRoute = async (context) => {
  try {
    // Optional: Add authentication check if needed
    // const user = getUserFromContext(context);
    // if (!user) return new Response(JSON.stringify(unauthorizedResponse()), { status: 401 });

    const pricingService = PricingService.getInstance();
    await pricingService.initializeDefaultPricing();

    const plans = await pricingService.getAllPricingPlans();
    return new Response(
      JSON.stringify(
        successResponse({
          message: "Pricing plans initialized",
          plans,
        }),
      ),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error initializing pricing plans:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Failed to initialize pricing plans")),
      { status: 400 },
    );
  }
};
