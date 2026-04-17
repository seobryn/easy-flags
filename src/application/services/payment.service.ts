import { getRepositoryRegistry } from "@infrastructure/registry";
import type { PaymentGateway } from "@application/ports/repositories";
import type { PaymentStatus } from "@domain/entities";
import { PricingService } from "./pricing.service";
import { WompiPaymentGateway } from "@infrastructure/adapters/wompi.adapter";

export class PaymentService {
  private static instance: PaymentService | null = null;
  private paymentGateway: PaymentGateway;

  constructor(paymentGateway: PaymentGateway) {
    this.paymentGateway = paymentGateway;
  }

  static getInstance(): PaymentService {
    if (!this.instance) {
      this.instance = new PaymentService(new WompiPaymentGateway());
    }
    return this.instance;
  }

  async getAcceptanceTokens() {
    const merchantInfo = await this.paymentGateway.getMerchantInfo();
    return {
      acceptanceToken: merchantInfo.presigned_acceptance?.acceptance_token,
      acceptanceText: merchantInfo.presigned_acceptance?.permalink,
      dataPrivacyToken: merchantInfo.presigned_personal_data_auth?.acceptance_token,
      dataPrivacyText: merchantInfo.presigned_personal_data_auth?.permalink,
    };
  }

  async initializePayment(
    userId: number, 
    planSlug: string, 
    ip: string = "", 
    customerData?: { 
      phoneNumber?: string; 
      phoneNumberPrefix?: string; 
      legalId?: string; 
      legalIdType?: string;
      addressLine1?: string;
      city?: string;
      region?: string;
    }
  ) {
    const registry = getRepositoryRegistry();
    const userRepo = registry.getUserRepository();
    const planRepo = registry.getPricingPlanRepository();
    const paymentRepo = registry.getPaymentRepository();

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const plan = await planRepo.findBySlug(planSlug);
    if (!plan) {
      throw new Error("Pricing plan not found");
    }

    // Detect country based on IP
    const country = await this.detectCountry(ip);

    let currency = "USD";
    let amount = plan.price_usd;

    if (country === "CO") {
      currency = "COP";
      amount = plan.price_cop;
    }

    const reference = `EF-USR-${userId}-${plan.id}-${Date.now()}`;
    const amountInCents = Math.round(amount * 100);
    const normalizedCurrency = currency.toUpperCase();

    const publicKey = this.paymentGateway.getPublicKey();
    if (!publicKey) {
      throw new Error("Wompi Public Key is not configured.");
    }

    const transaction = await paymentRepo.create({
      user_id: userId,
      pricing_plan_id: plan.id,
      amount,
      currency: normalizedCurrency,
      reference,
      status: "PENDING",
    });

    const signature = this.paymentGateway.generateIntegritySignature(
      reference,
      amountInCents,
      normalizedCurrency
    );

    const acceptance = await this.getAcceptanceTokens();

    return {
      transaction,
      signature,
      publicKey,
      amountInCents,
      currency: normalizedCurrency,
      country,
      acceptance,
      customer: {
        email: user.email,
        fullName: user.username,
        phoneNumber: customerData?.phoneNumber || "",
        phoneNumberPrefix: customerData?.phoneNumberPrefix || "+57",
        legalId: customerData?.legalId,
        legalIdType: customerData?.legalIdType,
      },
      shippingAddress: customerData?.addressLine1 ? {
        addressLine1: customerData.addressLine1,
        city: customerData.city || "",
        phoneNumber: customerData.phoneNumber || "",
        region: customerData.region || "",
        country: "CO"
      } : undefined
    };
  }

  async processPayment(
    userId: number,
    paymentData: {
      token: string;
      acceptance_token: string;
      personal_data_auth_token: string;
      reference: string;
      amountInCents: number;
      currency: string;
      customerData: any;
      shippingAddress?: any;
    }
  ) {
    const registry = getRepositoryRegistry();
    const paymentRepo = registry.getPaymentRepository();

    const transaction = await paymentRepo.findByReference(paymentData.reference);
    if (!transaction || transaction.user_id !== userId) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Generate integrity signature again to be safe
    const signature = this.paymentGateway.generateIntegritySignature(
      paymentData.reference,
      paymentData.amountInCents,
      paymentData.currency
    );

    const payload = {
      amount_in_cents: paymentData.amountInCents,
      currency: paymentData.currency,
      signature,
      customer_email: paymentData.customerData.email,
      payment_method: {
        type: "CARD",
        token: paymentData.token,
        installments: 1, // Default to 1 for simplicity
      },
      reference: paymentData.reference,
      acceptance_token: paymentData.acceptance_token,
      accept_personal_auth: paymentData.personal_data_auth_token,
      customer_data: {
        phone_number: `${paymentData.customerData.phoneNumberPrefix || "+57"}${paymentData.customerData.phoneNumber}`.replace(/\+/g, ""),
        full_name: paymentData.customerData.fullName,
        legal_id: paymentData.customerData.legalId,
        legal_id_type: paymentData.customerData.legalIdType,
      },
      shipping_address: paymentData.shippingAddress ? {
        address_line_1: paymentData.shippingAddress.addressLine1,
        city: paymentData.shippingAddress.city,
        phone_number: paymentData.shippingAddress.phoneNumber,
        region: paymentData.shippingAddress.region,
        country: "CO",
      } : undefined,
    };

    const wompiTx = await this.paymentGateway.createTransaction(payload);
    const paymentStatus = this.mapWompiStatus(wompiTx.status);

    // Update transaction with external ID
    await paymentRepo.update(transaction.id, {
      external_id: wompiTx.id,
      status: paymentStatus,
    });

    // If payment is approved, assign the plan to the user immediately
    if (paymentStatus === "APPROVED") {
      const plan = await registry.getPricingPlanRepository().findById(transaction.pricing_plan_id);
      if (plan) {
        await PricingService.getInstance().assignPlanToUser(
          transaction.user_id,
          plan.slug
        );
      }
    }

    return wompiTx;
  }

  private async detectCountry(ip: string): Promise<string> {
    // In production, use Cloudflare CF-IPCountry header or a GeoIP service
    // For this implementation, we will check if the user is in Colombia
    // as per requirements. 
    // If IP is empty or local, default to CO for testing if needed, 
    // or use a real service.

    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      // Default to CO for testing if requested, or US
      return "CO";
    }

    try {
      const response = await fetch(`https://ipapi.co/${ip}/country/`);
      if (response.ok) {
        return (await response.text()).trim();
      }
    } catch (e) {
      console.error("GeoIP Error:", e);
    }

    return "US"; // Fallback
  }

  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    const isValid = this.paymentGateway.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return false;
    }

    const { transaction: wompiTx } = payload.data;
    const externalId = wompiTx.id;
    const status = wompiTx.status;
    const reference = wompiTx.reference;

    const registry = getRepositoryRegistry();
    const paymentRepo = registry.getPaymentRepository();
    const planRepo = registry.getPricingPlanRepository();

    const transaction = await paymentRepo.findByReference(reference);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const paymentStatus = this.mapWompiStatus(status);

    await paymentRepo.update(transaction.id, {
      status: paymentStatus,
      external_id: externalId,
    });

    if (paymentStatus === "APPROVED") {
      const plan = await planRepo.findById(transaction.pricing_plan_id);
      if (plan) {
        await PricingService.getInstance().assignPlanToUser(
          transaction.user_id,
          plan.slug
        );
      }
    }

    return true;
  }

  private mapWompiStatus(wompiStatus: string): PaymentStatus {
    switch (wompiStatus) {
      case "APPROVED":
        return "APPROVED";
      case "DECLINED":
        return "DECLINED";
      case "VOIDED":
        return "VOIDED";
      case "ERROR":
        return "ERROR";
      default:
        return "PENDING";
    }
  }
}
