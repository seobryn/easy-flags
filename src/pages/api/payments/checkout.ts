import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { PaymentService } from "@/application/services/payment.service";
import { SpaceService } from "@/application/services/index";
import { 
  successResponse, 
  unauthorizedResponse, 
  badRequestResponse, 
  HTTP_STATUS 
} from "@/utils/api";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  try {
    const body = await context.request.json();
    let { spaceId, planSlug } = body;

    if (!planSlug) {
      return new Response(JSON.stringify(badRequestResponse("planSlug is required")), {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // If spaceId is not provided, pick the user's first space
    if (!spaceId) {
      const spaceService = new SpaceService();
      const spaces = await spaceService.getUserSpaces(user.id);
      
      if (spaces.length === 0) {
        return new Response(JSON.stringify(badRequestResponse("User has no spaces to upgrade")), {
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }
      
      spaceId = spaces[0].id;
    }

    const paymentService = PaymentService.getInstance();
    const paymentData = await paymentService.initializePayment(spaceId, planSlug);

    return new Response(JSON.stringify(successResponse(paymentData)), {
      status: HTTP_STATUS.OK,
    });
  } catch (error: any) {
    console.error("[Checkout API Error]:", error);
    return new Response(JSON.stringify(badRequestResponse(error.message || "An error occurred during checkout initialization")), {
      status: HTTP_STATUS.BAD_REQUEST,
    });
  }
};
