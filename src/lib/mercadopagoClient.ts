/**
 * Mercadopago Backend Client
 * Uses @mercadopago/sdk-js with direct API calls for payment processing
 */

const MERCADOPAGO_API_BASE = "https://api.mercadopago.com";

export class MercadopagoClient {
  private static accessToken: string;

  static initialize() {
    const token = import.meta.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN not set in environment variables",
      );
    }
    this.accessToken = token;
  }

  static async createPayment(data: any) {
    try {
      this.initialize();
      
      const response = await fetch(`${MERCADOPAGO_API_BASE}/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || `Payment API error: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to create payment with Mercadopago",
      );
    }
  }

  static async getPayment(paymentId: number) {
    try {
      this.initialize();
      
      const response = await fetch(
        `${MERCADOPAGO_API_BASE}/v1/payments/${paymentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Payment API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to retrieve payment");
    }
  }
}
