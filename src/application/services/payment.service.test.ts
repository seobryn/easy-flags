import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "./payment.service";
import { PricingService } from "./pricing.service";
import { getRepositoryRegistry } from "@infrastructure/registry";
import type { Space, PricingPlan, PaymentTransaction } from "@domain/entities";

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
  let mockSpaceRepo: any;
  let mockPricingPlanRepo: any;
  let mockPaymentRepo: any;
  let mockPaymentGateway: any;
  let mockPricingService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSpaceRepo = { findById: vi.fn() };
    mockPricingPlanRepo = { findBySlug: vi.fn(), findById: vi.fn() };
    mockPaymentRepo = { 
      create: vi.fn(), 
      update: vi.fn(),
      findByReference: vi.fn() 
    };
    mockPaymentGateway = { 
      generateIntegritySignature: vi.fn(),
      verifyWebhookSignature: vi.fn()
    };
    mockPricingService = {
      assignPlanToSpace: vi.fn()
    };

    (getRepositoryRegistry as any).mockReturnValue({
      getSpaceRepository: () => mockSpaceRepo,
      getPricingPlanRepository: () => mockPricingPlanRepo,
      getPaymentRepository: () => mockPaymentRepo,
    });

    (PricingService.getInstance as any).mockReturnValue(mockPricingService);

    service = new PaymentService(mockPaymentGateway);
  });

  describe("initializePayment", () => {
    it("should initialize a payment transaction", async () => {
      const spaceId = 1;
      const planSlug = "pro-monthly";
      const space: Space = { 
        id: spaceId, 
        name: "Test Space", 
        slug: "test-space", 
        owner_id: 1, 
        created_at: "", 
        updated_at: "" 
      };
      const plan: PricingPlan = { 
        id: 10, 
        slug: planSlug, 
        name: "Pro Monthly", 
        price: 29000, 
        billing_period: "monthly", 
        is_active: true, 
        is_recommended: true, 
        sort_order: 1, 
        created_at: "", 
        updated_at: "" 
      };
      const transaction: PaymentTransaction = {
        id: 100,
        space_id: spaceId,
        pricing_plan_id: plan.id,
        amount: plan.price,
        currency: "COP",
        reference: "test-ref-123",
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSpaceRepo.findById.mockResolvedValue(space);
      mockPricingPlanRepo.findBySlug.mockResolvedValue(plan);
      mockPaymentRepo.create.mockResolvedValue(transaction);
      mockPaymentGateway.generateIntegritySignature.mockReturnValue("mock-signature");

      const result = await service.initializePayment(spaceId, planSlug);

      expect(mockSpaceRepo.findById).toHaveBeenCalledWith(spaceId);
      expect(mockPricingPlanRepo.findBySlug).toHaveBeenCalledWith(planSlug);
      expect(mockPaymentRepo.create).toHaveBeenCalled();
      expect(mockPaymentGateway.generateIntegritySignature).toHaveBeenCalled();
      
      expect(result).toEqual({
        transaction,
        signature: "mock-signature",
        publicKey: expect.any(String),
        amountInCents: 2900000,
        currency: "COP"
      });
    });

    it("should throw error if space not found", async () => {
      mockSpaceRepo.findById.mockResolvedValue(null);
      await expect(service.initializePayment(1, "pro")).rejects.toThrow("Space not found");
    });

    it("should throw error if plan not found", async () => {
      mockSpaceRepo.findById.mockResolvedValue({ id: 1 });
      mockPricingPlanRepo.findBySlug.mockResolvedValue(null);
      await expect(service.initializePayment(1, "invalid")).rejects.toThrow("Pricing plan not found");
    });
  });

  describe("handleWebhook", () => {
    const mockPayload = {
      data: {
        transaction: {
          id: "wompi-123",
          status: "APPROVED",
          reference: "EF-1-10-123456",
          amount_in_cents: 29000,
        }
      }
    };
    const mockSignature = "valid-signature";

    it("should handle an APPROVED payment and assign plan to space", async () => {
      const transaction: PaymentTransaction = {
        id: 100,
        space_id: 1,
        pricing_plan_id: 10,
        amount: 290,
        currency: "COP",
        reference: "EF-1-10-123456",
        status: "PENDING",
        created_at: "",
        updated_at: ""
      };
      const plan: PricingPlan = {
        id: 10,
        slug: "pro",
        name: "Pro",
        price: 290,
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
      expect(mockPaymentRepo.findByReference).toHaveBeenCalledWith("EF-1-10-123456");
      expect(mockPaymentRepo.update).toHaveBeenCalledWith(transaction.id, {
        status: "APPROVED",
        external_id: "wompi-123"
      });
      expect(mockPricingService.assignPlanToSpace).toHaveBeenCalledWith(1, "pro");
    });

    it("should handle a DECLINED payment and not assign plan", async () => {
      const transaction: PaymentTransaction = {
        id: 100,
        space_id: 1,
        pricing_plan_id: 10,
        amount: 290,
        currency: "COP",
        reference: "EF-1-10-123456",
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
      expect(mockPricingService.assignPlanToSpace).not.toHaveBeenCalled();
    });

    it("should return false if signature is invalid", async () => {
      mockPaymentGateway.verifyWebhookSignature.mockReturnValue(false);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toBe(false);
      expect(mockPaymentRepo.findByReference).not.toHaveBeenCalled();
    });

    it("should throw error if transaction reference not found", async () => {
      mockPaymentGateway.verifyWebhookSignature.mockReturnValue(true);
      mockPaymentRepo.findByReference.mockResolvedValue(null);

      await expect(service.handleWebhook(mockPayload, mockSignature)).rejects.toThrow("Transaction not found");
    });
  });
});
