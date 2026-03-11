import { MercadoPagoConfig, Payment } from "mercadopago";

let mercadopagoInstance: MercadoPagoConfig | null = null;

export function getMercadopagoClient(): MercadoPagoConfig {
  if (!mercadopagoInstance) {
    const accessToken = import.meta.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN not set in environment variables. Please add it to your .env file.",
      );
    }

    mercadopagoInstance = new MercadoPagoConfig({
      accessToken: accessToken,
    });
  }

  return mercadopagoInstance;
}

export class MercadopagoClient {
  static getConfig(): MercadoPagoConfig {
    return getMercadopagoClient();
  }

  static async createPayment(data: any) {
    const client = getMercadopagoClient();
    const payment = new Payment(client);
    return payment.create(data);
  }

  static async getPayment(paymentId: number) {
    const client = getMercadopagoClient();
    const payment = new Payment(client);
    return payment.get(paymentId);
  }
}
