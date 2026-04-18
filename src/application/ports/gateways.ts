/**
 * Port Layer - Gateway Interfaces
 * These define contracts for external services (Email, SMS, etc.)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface EmailGateway {
  sendEmail(options: EmailOptions): Promise<void>;
}
