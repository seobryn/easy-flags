import { describe, it, expect, beforeEach, vi } from "vitest";
import { WompiPaymentGateway } from "./wompi.adapter";
import crypto from "node:crypto";

describe("WompiPaymentGateway", () => {
  let gateway: WompiPaymentGateway;
  const INTEGRITY_SECRET = "test_integrity_123";
  const EVENT_SECRET = "test_event_456";

  beforeEach(() => {
    vi.stubEnv("WOMPI_PUBLIC_KEY", "pub_test_123");
    vi.stubEnv("WOMPI_INTEGRITY_SECRET", INTEGRITY_SECRET);
    vi.stubEnv("WOMPI_EVENT_SECRET", EVENT_SECRET);
    gateway = new WompiPaymentGateway();
  });

  describe("generateIntegritySignature", () => {
    it("should generate a valid SHA256 signature", () => {
      const reference = "payment_001";
      const amount = 500000;
      const currency = "COP";
      
      const expectedData = `${reference}${amount}${currency}${INTEGRITY_SECRET}`;
      const expectedHash = crypto.createHash("sha256").update(expectedData).digest("hex");
      
      const signature = gateway.generateIntegritySignature(reference, amount, currency);
      
      expect(signature).toBe(expectedHash);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should verify a valid webhook signature", () => {
      const timestamp = 1618675200;
      const payload = {
        data: {
          transaction: {
            id: "123-abc",
            status: "APPROVED",
            amount_in_cents: 500000
          }
        },
        timestamp,
        signature: {
          properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
        }
      };
      
      const dataToSign = `123-abcAPPROVED500000${timestamp}${EVENT_SECRET}`;
      const validSignature = crypto.createHash("sha256").update(dataToSign).digest("hex");
      
      const result = gateway.verifyWebhookSignature(payload, validSignature);
      
      expect(result).toBe(true);
    });

    it("should return false for invalid signature", () => {
      const payload = {
        data: { transaction: { id: "123" } },
        timestamp: 12345678,
        signature: { properties: ["transaction.id"] }
      };
      
      const result = gateway.verifyWebhookSignature(payload, "invalid_signature");
      
      expect(result).toBe(false);
    });

    it("should return false for missing fields in payload", () => {
      const payload = { data: {} }; // Missing signature and timestamp
      const result = gateway.verifyWebhookSignature(payload, "any");
      expect(result).toBe(false);
    });
  });
});
