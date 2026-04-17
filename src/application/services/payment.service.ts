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

  async initializePayment(spaceId: number, planSlug: string) {
    const registry = getRepositoryRegistry();
    const spaceRepo = registry.getSpaceRepository();
    const planRepo = registry.getPricingPlanRepository();
    const paymentRepo = registry.getPaymentRepository();

    const space = await spaceRepo.findById(spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    const plan = await planRepo.findBySlug(planSlug);
    if (!plan) {
      throw new Error("Pricing plan not found");
    }

    const reference = `EF-${spaceId}-${plan.id}-${Date.now()}`;
    const amount = plan.price;
    const amountInCents = Math.round(amount * 100);
    const currency = "COP";

    const transaction = await paymentRepo.create({
      space_id: spaceId,
      pricing_plan_id: plan.id,
      amount,
      currency,
      reference,
      status: "PENDING",
    });

    const signature = this.paymentGateway.generateIntegritySignature(
      reference,
      amountInCents,
      currency
    );

    return {
      transaction,
      signature,
      publicKey: process.env.WOMPI_PUBLIC_KEY || "pub_test_dummy",
      amountInCents,
      currency,
    };
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
        await PricingService.getInstance().assignPlanToSpace(
          transaction.space_id,
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
