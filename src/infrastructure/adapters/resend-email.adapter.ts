import type { EmailGateway, EmailOptions } from "@application/ports/gateways";
import { EnvManager } from "@lib/env";

export class ResendEmailGateway implements EmailGateway {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = EnvManager.get("RESEND_API_KEY") || "";
    this.fromEmail = EnvManager.get("EMAIL_FROM") || "onboarding@resend.dev";
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.apiKey) {
      console.warn("⚠️ RESEND_API_KEY not found. Email not sent.");
      console.log("Email content:", options);
      return;
    }

    try {
      // Simple HTML template builder based on template name
      const html = this.renderTemplate(options.template, options.context);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API specialized error: ${JSON.stringify(error)}`);
      }

      console.log(`✅ Email sent via Resend: ${options.subject} to ${options.to}`);
    } catch (error) {
      console.error("❌ Failed to send email via Resend:", error);
      throw error;
    }
  }

  private renderTemplate(template: string, context: Record<string, any>): string {
    // Simple template rendering for now
    // In a more complex app, we could use React components or a dedicated template engine
    switch (template) {
      case "welcome_verification":
        return `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: white; border-radius: 20px;">
            <h1 style="color: #c084fc;">Welcome to Easy Flags!</h1>
            <p>Hi ${context.username},</p>
            <p>To start using your account, please verify your email address by clicking the link below:</p>
            <a href="${context.verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 20px 0;">Verify My Account</a>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Easy Flags Team</p>
          </div>
        `;
      case "password_changed":
        return `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: white; border-radius: 20px;">
            <h1 style="color: #c084fc;">Security Alert</h1>
            <p>Your password has been successfully changed.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Easy Flags Team</p>
          </div>
        `;
      case "purchase_confirmed":
        return `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: white; border-radius: 20px;">
            <h1 style="color: #22d3ee;">Purchase Confirmed!</h1>
            <p>Thank you for your purchase.</p>
            <p><strong>Item:</strong> ${context.planName}</p>
            <p><strong>Amount:</strong> ${context.amount} ${context.currency}</p>
            <p><strong>Status:</strong> ${context.status}</p>
            <p>Your subscription is now active.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Easy Flags Team</p>
          </div>
        `;
      default:
        return `<p>${JSON.stringify(context)}</p>`;
    }
  }
}
