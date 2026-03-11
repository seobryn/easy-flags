import React, { useState } from "react";
import MercadopagoCheckoutForm from "./MercadopagoCheckoutForm";

interface BillingPlan {
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
  priceId?: string;
  description?: string;
}

interface CheckoutButtonProps {
  plan: BillingPlan;
}

export default function CheckoutButton({ plan }: CheckoutButtonProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleCheckout = async () => {
    // Check if user is logged in
    const userResponse = await fetch("/api/auth/me");
    if (!userResponse.ok) {
      window.location.href = "/login";
      return;
    }

    // Show payment form
    setShowPaymentForm(true);
  };

  if (showPaymentForm && plan.price > 0) {
    return (
      <div className="space-y-4 mb-6">
        <button
          onClick={() => setShowPaymentForm(false)}
          className="text-sm text-slate-400 hover:text-slate-300 transition"
        >
          ← Back
        </button>
        <MercadopagoCheckoutForm
          planId={plan.priceId || ""}
          planTitle={plan.name}
          amount={plan.price * 100} // Convert to cents
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-6">
      {plan.price === 0 ? (
        <a
          href="/spaces"
          className="block w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
        >
          Get Started
        </a>
      ) : (
        <button
          onClick={handleCheckout}
          className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          Get Started
        </button>
      )}
    </div>
  );
}
