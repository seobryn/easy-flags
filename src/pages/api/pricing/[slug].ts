import type { APIRoute } from "astro";
import { successResponse, badRequestResponse } from "@/utils/api";
import { PricingService } from "@application/services";

export const prerender = false;

// GET /api/pricing/[slug] - Get a specific pricing plan by slug
export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug || typeof slug !== "string") {
      return new Response(
        JSON.stringify(badRequestResponse("Pricing plan slug is required")),
        { status: 400 },
      );
    }

    const pricingService = PricingService.getInstance();
    const plan = await pricingService.getPricingPlanBySlug(slug);

    if (!plan) {
      return new Response(
        JSON.stringify(badRequestResponse("Pricing plan not found")),
        { status: 404 },
      );
    }

    return new Response(JSON.stringify(successResponse(plan)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching pricing plan:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Failed to fetch pricing plan")),
      { status: 400 },
    );
  }
};
