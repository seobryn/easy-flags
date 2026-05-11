import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/utils/api";
import { PricingService, SpaceService } from "@application/services";

export const prerender = false;

// GET /api/pricing/subscriptions/[spaceId] - Get subscription for a space
export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const { spaceId } = context.params;

    if (!spaceId || typeof spaceId !== "string") {
      return new Response(
        JSON.stringify(badRequestResponse("Space ID is required")),
        { status: 400 },
      );
    }

    // Verify user has access to this space
    const spaceService = new SpaceService();
    const space = await spaceService.getSpace(Number(spaceId));

    if (!space) {
      return new Response(
        JSON.stringify(badRequestResponse("Space not found")),
        { status: 404 },
      );
    }

    // TODO: Add permission check here
    // if (!hasAccess(user.id, space.id)) { return unauthorizedResponse(); }

    const pricingService = PricingService.getInstance();
    const subscription = await pricingService.getUserSubscription(
      space.owner_id,
    );

    return new Response(JSON.stringify(successResponse(subscription)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching space subscription:", error);
    return new Response(
      JSON.stringify(badRequestResponse("Failed to fetch subscription")),
      { status: 400 },
    );
  }
};
