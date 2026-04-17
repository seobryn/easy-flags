import type { APIRoute } from "astro";
import { PaymentService } from "@/application/services/payment.service";
import { HTTP_STATUS } from "@/utils/api";

export const prerender = false;

/**
 * Wompi Webhook handler
 * CSRF protection: Public endpoint, verifies signature
 */
export const POST: APIRoute = async (context) => {
  try {
    const payload = await context.request.json();
    
    // Wompi sends signature in checksum field of signature object, 
    // or sometimes as a header X-Event-Checksum
    const signature = context.request.headers.get("x-event-checksum") || 
                     payload.signature?.checksum;

    if (!signature) {
      console.error("[Wompi Webhook Error]: Missing signature");
      return new Response("Missing signature", { status: HTTP_STATUS.BAD_REQUEST });
    }

    const paymentService = PaymentService.getInstance();
    const result = await paymentService.handleWebhook(payload, signature);

    if (result) {
      return new Response("OK", { status: HTTP_STATUS.OK });
    } else {
      console.error("[Wompi Webhook Error]: Invalid signature or processing failed");
      return new Response("Invalid signature", { status: HTTP_STATUS.BAD_REQUEST });
    }
  } catch (error: any) {
    console.error("[Wompi Webhook Error]:", error);
    return new Response(error.message || "Internal Server Error", { 
      status: HTTP_STATUS.INTERNAL_ERROR 
    });
  }
};
