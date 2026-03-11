import type { APIRoute } from "astro";
import { MercadopagoService } from "@/application/services/MercadopagoService";

export const prerender = false;

interface ProcessPaymentRequest {
  token: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  issuer_id?: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  description: string;
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

    const body = (await context.request.json()) as ProcessPaymentRequest;

    if (!body.token || !body.payment_method_id || !body.transaction_amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required payment fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create payment
    const payment = await MercadopagoService.createPayment({
      token: body.token,
      payment_method_id: body.payment_method_id,
      transaction_amount: body.transaction_amount,
      installments: body.installments || 1,
      issuer_id: body.issuer_id,
      payer: body.payer,
      description: body.description,
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error processing Mercadopago payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process payment",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
