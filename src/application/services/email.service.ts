import type { EmailGateway } from "@application/ports/gateways";
import { ResendEmailGateway } from "@infrastructure/adapters/resend-email.adapter";
import { EnvManager } from "@lib/env";

export class EmailService {
  private static instance: EmailService;
  private gateway: EmailGateway;
  private baseUrl: string;

  private constructor(gateway: EmailGateway) {
    this.gateway = gateway;
    this.baseUrl = EnvManager.get("SITE_URL") || "http://localhost:3000";
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      // For now we use ResendEmailGateway as default
      EmailService.instance = new EmailService(new ResendEmailGateway());
    }
    return EmailService.instance;
  }

  async sendVerificationEmail(email: string, username: string, token: string, lang: string = "en"): Promise<void> {
    const verificationLink = `${this.baseUrl}/${lang}/verify?token=${token}`;
    
    await this.gateway.sendEmail({
      to: email,
      subject: "Verify your Easy Flags account",
      template: "welcome_verification",
      context: {
        username,
        verificationLink,
      },
    });
  }

  async sendPasswordChangedEmail(email: string): Promise<void> {
    await this.gateway.sendEmail({
      to: email,
      subject: "Security Alert: Password Changed",
      template: "password_changed",
      context: {},
    });
  }

  async sendPurchaseConfirmationEmail(
    email: string, 
    planName: string, 
    amount: number, 
    currency: string, 
    status: string
  ): Promise<void> {
    await this.gateway.sendEmail({
      to: email,
      subject: "Purchase Confirmation - Easy Flags",
      template: "purchase_confirmed",
      context: {
        planName,
        amount,
        currency,
        status,
      },
    });
  }
}
