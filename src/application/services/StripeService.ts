import { stripeClient } from "@/lib/stripeClient";

interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  interval: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export class StripeService {
  static async getPrices(): Promise<StripePrice[]> {
    try {
      console.log("Fetching Stripe prices...");

      const prices = await stripeClient.prices.list({
        active: true,
        expand: ["data.product"],
        limit: 100,
      });

      console.log(`Found ${prices.data.length} active prices`);

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

      console.log("Mapped prices:", mapped);

      return mapped;
    } catch (error: any) {
      console.error("Error fetching Stripe prices:", error.message, error);
      throw new Error(error.message || "Failed to fetch Stripe prices");
    }
  }
}
