import React, { useState } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is logged in
      const userResponse = await fetch("/api/auth/me");
      if (!userResponse.ok) {
        window.location.href = "/login";
        return;
      }

      if (!plan.priceId) {
        setError("Price information not available for this plan");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mb-6">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full btn-primary ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Get Started"}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
