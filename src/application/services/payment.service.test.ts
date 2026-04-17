import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "./payment.service";
import { PricingService } from "./pricing.service";
import { getRepositoryRegistry } from "@infrastructure/registry";
import type { User, PricingPlan, PaymentTransaction } from "@domain/entities";

vi.mock("@infrastructure/registry", () => ({
  getRepositoryRegistry: vi.fn(),
}));

vi.mock("./pricing.service", () => ({
  PricingService: {
    getInstance: vi.fn(),
  },
}));

describe("PaymentService", () => {
  let service: PaymentService;
  let mockUserRepo: any;
  let mockPricingPlanRepo: any;
  let mockPaymentRepo: any;
  let mockPaymentGateway: any;
  let mockPricingService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepo = { findById: vi.fn() };
    mockPricingPlanRepo = { findBySlug: vi.fn(), findById: vi.fn() };
    mockPaymentRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findByReference: vi.fn()
    };
    mockPaymentGateway = {
      getPublicKey: vi.fn(() => "pub_test_123"),
      getMerchantInfo: vi.fn(),
      createTransaction: vi.fn(),
      generateIntegritySignature: vi.fn(),
      verifyWebhookSignature: vi.fn()
    };
    mockPricingService = {
      assignPlanToUser: vi.fn()
    };

    (getRepositoryRegistry as any).mockReturnValue({
      getUserRepository: () => mockUserRepo,
      getPricingPlanRepository: () => mockPricingPlanRepo,
      getPaymentRepository: () => mockPaymentRepo,
    });

    (PricingService.getInstance as any).mockReturnValue(mockPricingService);

    service = new PaymentService(mockPaymentGateway);
  });

  describe("initializePayment", () => {
    it("should initialize a payment transaction", async () => {
      const userId = 1;
      const planSlug = "pro-monthly";
      const user: User = {
        id: userId,
        username: "testuser",
        email: "test@example.com",
        role_id: 1,
        is_active: true,
        created_at: "",
        updated_at: ""
      };
      const plan: any = {
        id: 10,
        slug: planSlug,
        name: "Pro Monthly",
        price_usd: 29,
        price_cop: 29000,
        billing_period: "monthly",
        is_active: true,
        is_recommended: true,
        sort_order: 1,
        created_at: "",
        updated_at: ""
      };
      const transaction: PaymentTransaction = {
        id: 100,
        user_id: userId,
        pricing_plan_id: plan.id,
        amount: plan.price_cop,
        currency: "COP",
        reference: "test-ref-123",
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockUserRepo.findById.mockResolvedValue(user);
      mockPricingPlanRepo.findBySlug.mockResolvedValue(plan);
      mockPaymentRepo.create.mockResolvedValue(transaction);
      mockPaymentGateway.generateIntegritySignature.mockReturnValue("mock-signature");
      mockPaymentGateway.getMerchantInfo.mockResolvedValue({
        presigned_acceptance: { acceptance_token: "acc-123", permalink: "url-1" },
        presigned_personal_data_auth: { acceptance_token: "priv-123", permalink: "url-2" }
      });

      const customerData = {
        phoneNumber: "3001234567",
        legalId: "123456789",
        legalIdType: "CC",
        addressLine1: "Calle 123 # 45-67",
        city: "Bogotá",
        region: "Cundinamarca"
      };

      const result = await service.initializePayment(userId, planSlug, "127.0.0.1", customerData);

      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockPricingPlanRepo.findBySlug).toHaveBeenCalledWith(planSlug);
      expect(mockPaymentRepo.create).toHaveBeenCalled();
      expect(mockPaymentGateway.generateIntegritySignature).toHaveBeenCalled();
      expect(mockPaymentGateway.getMerchantInfo).toHaveBeenCalled();

      expect(result).toEqual({
        transaction,
        signature: "mock-signature",
        publicKey: "pub_test_123",
        amountInCents: 2900000,
        currency: "COP",
        country: "CO",
        acceptance: {
          acceptanceToken: "acc-123",
          acceptanceText: "url-1",
          dataPrivacyToken: "priv-123",
          dataPrivacyText: "url-2"
        },
        customer: {
          email: "test@example.com",
          fullName: "testuser",
          phoneNumber: "3001234567",
          phoneNumberPrefix: "+57",
          legalId: "123456789",
          legalIdType: "CC"
        },
        shippingAddress: {
          addressLine1: "Calle 123 # 45-67",
          city: "Bogotá",
          phoneNumber: "3001234567",
          region: "Cundinamarca",
          country: "CO"
        }
      });
    });

    it("should throw error if public key is missing", async () => {
      mockPaymentGateway.getPublicKey.mockReturnValue("");
      mockUserRepo.findById.mockResolvedValue({ id: 1 });
      mockPricingPlanRepo.findBySlug.mockResolvedValue({ id: 10, price_cop: 29000 });

      await expect(service.initializePayment(1, "pro")).rejects.toThrow("Wompi Public Key is not configured.");
    });

    it("should throw error if user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(service.initializePayment(1, "pro")).rejects.toThrow("User not found");
    });

    it("should throw error if plan not found", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 1 });
      mockPricingPlanRepo.findBySlug.mockResolvedValue(null);
      await expect(service.initializePayment(1, "invalid")).rejects.toThrow("Pricing plan not found");
    });
  });

  describe("processPayment", () => {
    it("should process a payment and assign plan if approved", async () => {
      const paymentData = {
        token: "tok_test_123",
        acceptance_token: "acc-123",
        personal_data_auth_token: "priv-123",
        reference: "test-ref-123",
        amountInCents: 2900000,
        currency: "COP",
        customerData: {
          email: "test@example.com",
          fullName: "Test User",
        },
      };

      const transaction: PaymentTransaction = {
        id: 100,
        user_id: 1,
        pricing_plan_id: 10,
        amount: 290,
        currency: "COP",
        reference: "test-ref-123",
        status: "PENDING",
        created_at: "",
        updated_at: "",
      };

      const plan: any = {
        id: 10,
        slug: "pro-monthly",
      };

      mockPaymentRepo.findByReference.mockResolvedValue(transaction);
      mockPaymentGateway.createTransaction.mockResolvedValue({ id: "wompi-123", status: "APPROVED" });
      mockPricingPlanRepo.findById.mockResolvedValue(plan);

      await service.processPayment(1, paymentData);

      expect(mockPaymentRepo.update).toHaveBeenCalledWith(100, {
        external_id: "wompi-123",
        status: "APPROVED",
      });
      expect(mockPricingService.assignPlanToUser).toHaveBeenCalledWith(1, "pro-monthly");
    });
  });

  describe("handleWebhook", () => {
    const mockPayload = {
      data: {
        transaction: {
          id: "wompi-123",
          status: "APPROVED",
          reference: "EF-USR-1-10-123456",
          amount_in_cents: 29000,
        }
      }
    };
    const mockSignature = "valid-signature";

    it("should handle an APPROVED payment and assign plan to user", async () => {
      const transaction: PaymentTransaction = {
        id: 100,
        user_id: 1,
        pricing_plan_id: 10,
        amount: 290,
        currency: "COP",
        reference: "EF-USR-1-10-123456",
        status: "PENDING",
        created_at: "",
        updated_at: ""
      };
      const plan: any = {
        id: 10,
        slug: "pro",
        name: "Pro",
        price_cop: 290,
        price_usd: 2.9,
        billing_period: "monthly",
        is_active: true,
        is_recommended: true,
        sort_order: 1,
        created_at: "",
        updated_at: ""
      };
      mockPaymentGateway.verifyWebhookSignature.mockReturnValue(true);
      mockPaymentRepo.findByReference.mockResolvedValue(transaction);
      mockPricingPlanRepo.findById.mockResolvedValue(plan);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toBe(true);
      expect(mockPaymentGateway.verifyWebhookSignature).toHaveBeenCalledWith(mockPayload, mockSignature);
      expect(mockPaymentRepo.findByReference).toHaveBeenCalledWith("EF-USR-1-10-123456");
      expect(mockPaymentRepo.update).toHaveBeenCalledWith(transaction.id, {
        status: "APPROVED",
        external_id: "wompi-123"
      });
      expect(mockPricingService.assignPlanToUser).toHaveBeenCalledWith(1, "pro");
    });

    it("should handle a DECLINED payment and not assign plan", async () => {
      const transaction: PaymentTransaction = {
        id: 100,
        user_id: 1,
        pricing_plan_id: 10,
        amount: 290,
        currency: "COP",
        reference: "EF-USR-1-10-123456",
        status: "PENDING",
        created_at: "",
        updated_at: ""
      };
      const declinedPayload = {
        data: {
          transaction: {
            ...mockPayload.data.transaction,
            status: "DECLINED"
          }
        }
      };

      mockPaymentGateway.verifyWebhookSignature.mockReturnValue(true);
      mockPaymentRepo.findByReference.mockResolvedValue(transaction);

      const result = await service.handleWebhook(declinedPayload, mockSignature);

      expect(result).toBe(true);
      expect(mockPaymentRepo.update).toHaveBeenCalledWith(transaction.id, {
        status: "DECLINED",
        external_id: "wompi-123"
      });
      expect(mockPricingService.assignPlanToUser).not.toHaveBeenCalled();
    });
  });
});
