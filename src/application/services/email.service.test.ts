import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailService } from "@/application/services/email.service";
import { ResendEmailGateway } from "@/infrastructure/adapters/resend-email.adapter";

// Mock the ResendEmailGateway
vi.mock("@/infrastructure/adapters/resend-email.adapter");

describe("EmailService", () => {
  let emailService: EmailService;
  let mockGateway: any;

  beforeEach(() => {
    mockGateway = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    };
    emailService = new EmailService(mockGateway);
  });

  describe("sendTeamInvitationEmail", () => {
    it("should send a team invitation email with the correct parameters", async () => {
      const email = "test@example.com";
      const username = "testuser";
      const token = "test-token";
      const lang = "en";

      await emailService.sendTeamInvitationEmail(email, username, token, lang);

      expect(mockGateway.sendEmail).toHaveBeenCalledWith({
        to: email,
        subject: "You've been invited to join a team on Easy Flags",
        template: "team_invitation",
        context: {
          username,
          invitationLink: expect.stringContaining(token),
        },
      });
    });

    it("should use the default language if no language is provided", async () => {
      const email = "test@example.com";
      const username = "testuser";
      const token = "test-token";

      await emailService.sendTeamInvitationEmail(email, username, token);

      expect(mockGateway.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            username,
            invitationLink: expect.stringContaining(token),
          },
        })
      );
    });
  });
});