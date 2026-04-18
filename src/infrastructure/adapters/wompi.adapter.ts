import crypto from "node:crypto";
import type { PaymentGateway } from "@application/ports/repositories";

export interface WompiWidgetConfig {
  currency: "COP" | "USD";
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature?: string;
  redirectUrl?: string;
  expirationTime?: string; // ISO 8601 format
  taxInCents?: {
    vat?: number;
    consumption?: number;
  };
  customerData?: {
    email: string;
    fullName: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
    legalId?: string;
    legalIdType?: "CC" | "CE" | "NIT" | "PP" | "TI" | "DNI" | "RG" | "CPF";
  };
  shippingAddress?: {
    addressLine1: string;
    city: string;
    phoneNumber?: string;
    region?: string;
    country: string; // ISO 3166-1 alpha-2 (e.g., 'CO')
  };
}

import { EnvManager } from "@/lib/env";

export class WompiPaymentGateway implements PaymentGateway {
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;
  private readonly eventSecret: string;
  private readonly baseUrl: string;

  constructor() {
    this.publicKey = EnvManager.get("PUBLIC_WOMPI_PUBLIC_KEY");
    this.privateKey = EnvManager.get("WOMPI_PRIVATE_KEY");
    this.integritySecret = EnvManager.get("WOMPI_INTEGRITY_SECRET");
    this.eventSecret = EnvManager.get("WOMPI_EVENT_SECRET");

    // Determine base URL (sandbox or production)
    const isProd = !this.publicKey.startsWith("pub_test_");
    this.baseUrl = isProd 
      ? "https://production.wompi.co/v1" 
      : "https://sandbox.wompi.co/v1";

    if (!this.publicKey || !this.integritySecret || !this.eventSecret) {
      console.warn("Wompi credentials not fully configured in environment");
    }
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Retrieves a transaction status by ID.
   * GET /transactions/:id
   */
  async getTransactionStatus(transactionId: string): Promise<any> {
    const authHeader = this.privateKey 
      ? `Bearer ${this.privateKey}` 
      : `Bearer ${this.publicKey}`;

    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Wompi Get Transaction Error: ${JSON.stringify(result.error || result)}`);
    }

    return result.data;
  }

  /**
   * Fetches merchant information, including acceptance tokens for legal terms.
   * GET /merchants/:public_key
   */
  async getMerchantInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/merchants/${this.publicKey}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch merchant info: ${JSON.stringify(error)}`);
    }
    return (await response.json()).data;
  }

  /**
   * Creates a transaction using the Direct API.
   * POST /transactions
   */
  async createTransaction(payload: any): Promise<any> {
    // Backend to backend calls can use private key for authorization if required,
    // but Wompi Direct API for transactions typically uses the public key
    // in the header when acting on behalf of a frontend-tokenized card.
    const authHeader = this.privateKey 
      ? `Bearer ${this.privateKey}` 
      : `Bearer ${this.publicKey}`;

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Wompi Transaction Error: ${JSON.stringify(result.error || result)}`);
    }

    return result.data;
  }

  /**
   * Generates the integrity signature for Wompi transactions.
   * Algorithm: SHA256(reference + amount_in_cents + currency + integrity_secret)
   */
  generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const secret = import.meta.env.WOMPI_INTEGRITY_SECRET || this.integritySecret;

    if (!secret) {
      console.warn("Wompi integrity secret is not configured. Signature might be invalid.");
    }

    // Concatenate fields: reference + amountInCents + currency + integritySecret
    // Ensure all values are trimmed and formatted correctly as per Wompi requirements
    const formattedAmount = Math.floor(amountInCents).toString();
    const formattedCurrency = currency.toUpperCase().trim();
    const formattedReference = reference.trim();

    const data = `${formattedReference}${formattedAmount}${formattedCurrency}${secret}`;

    // Debug log for integrity signature (obfuscating secret)
    const obfuscatedData = `${formattedReference}${formattedAmount}${formattedCurrency}${secret ? secret.substring(0, 4) : ""}${secret ? "..." : "MISSING"}`;
    console.log("[WOMPI DEBUG] Concatenation string: " + obfuscatedData);

    const hash = crypto.createHash("sha256").update(data).digest("hex");
    console.log("[WOMPI DEBUG] Generated Hash: " + hash);

    return hash;
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
