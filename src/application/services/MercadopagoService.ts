import { MercadopagoClient } from "@/lib/mercadopagoClient";

interface MercadopagoPrice {
  id: string;
  unit_amount: number;
  currency: string;
  title: string;
  description: string | null;
}

interface PaymentRequest {
  token: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  issuer_id: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  description: string;
}

export class MercadopagoService {
  static async getPrices(): Promise<MercadopagoPrice[]> {
    try {
      console.log("Fetching Mercadopago prices...");

      // For this implementation, we're using predefined pricing tiers
      // In a production environment, you might want to fetch these from a database
      // or from Mercadopago's product catalog
      const prices: MercadopagoPrice[] = [
        {
          id: "lab_plan",
          unit_amount: 0, // Free tier
          currency: "USD",
          title: "Lab",
          description: "Perfect for testing and learning",
        },
        {
          id: "basic_plan",
          unit_amount: 999, // $9.99
          currency: "USD",
          title: "Basic",
          description: "Essential features for your project",
        },
        {
          id: "pro_plan",
          unit_amount: 2999, // $29.99
          currency: "USD",
          title: "Pro",
          description: "Advanced features for growing teams",
        },
      ];

      console.log(`Found ${prices.length} pricing plans`);
      return prices;
    } catch (error: any) {
      console.error("Error fetching Mercadopago prices:", error.message, error);
      throw new Error(error.message || "Failed to fetch Mercadopago prices");
    }
  }

  static async createPayment(paymentData: PaymentRequest) {
    try {
      console.log("Creating Mercadopago payment...");

      const payment = await MercadopagoClient.createPayment(paymentData);
      return payment;
    } catch (error: any) {
      console.error(
        "Error creating Mercadopago payment:",
        error.message,
        error,
      );
      throw new Error(error.message || "Failed to create Mercadopago payment");
    }
  }
}
