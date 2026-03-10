import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecret) {
      throw new Error(
        "STRIPE_SECRET_KEY not set in environment variables. Please add it to your .env file.",
      );
    }

    stripeInstance = new Stripe(stripeSecret);
  }

  return stripeInstance;
}

// For backward compatibility, export as stripeClient
export const stripeClient = {
  get prices() {
    return getStripeClient().prices;
  },
  get checkout() {
    return getStripeClient().checkout;
  },
  get webhooks() {
    return getStripeClient().webhooks;
  },
} as any;
