import crypto from "node:crypto";
import type { PaymentGateway } from "@application/ports/repositories";

export class WompiPaymentGateway implements PaymentGateway {
  private readonly publicKey: string;
  private readonly integritySecret: string;
  private readonly eventSecret: string;

  constructor() {
    this.publicKey = process.env.WOMPI_PUBLIC_KEY || "";
    this.integritySecret = process.env.WOMPI_INTEGRITY_SECRET || "";
    this.eventSecret = process.env.WOMPI_EVENT_SECRET || "";

    if (!this.publicKey || !this.integritySecret || !this.eventSecret) {
      console.warn("Wompi credentials not fully configured in environment");
    }
  }

  /**
   * Generates the integrity signature for Wompi transactions.
   * Algorithm: SHA256(reference + amount_in_cents + currency + integrity_secret)
   */
  generateIntegritySignature(
    reference: string,
    amount: number,
    currency: string,
  ): string {
    const data = `${reference}${amount}${currency}${this.integritySecret}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Verifies the webhook signature from Wompi.
   * Algorithm: Concatenate values from signature.properties + timestamp + event_secret
   * then SHA256 hash.
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!payload || !payload.signature || !payload.timestamp) {
      return false;
    }

    const { properties } = payload.signature;
    const { timestamp } = payload;

    if (!properties || !Array.isArray(properties)) {
      return false;
    }

    // Concatenate values based on properties order
    let data = "";
    for (const property of properties) {
      const value = this.getNestedValue(payload.data, property);
      data += value;
    }

    data += timestamp;
    data += this.eventSecret;

    const expectedSignature = crypto
      .createHash("sha256")
      .update(data)
      .digest("hex");

    return expectedSignature === signature;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }
}
