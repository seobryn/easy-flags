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

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!userResponse.ok) {
        window.location.href = "/login";
        return;
      }

      // TODO: Implement payment processing
      alert(`${plan.name} plan selected. Payment processing coming soon!`);
    } finally {
      setLoading(false);
    }
  };

  // Free tier - direct navigation
  if (plan.price === 0) {
    return (
      <div className="space-y-2 mb-6">
        <a
          href="/spaces"
          className="block w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
        >
          Get Started
        </a>
      </div>
    );
  }

  // Paid plans - coming soon
  return (
    <div className="space-y-2 mb-6">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Get Started"}
      </button>
      <p className="text-sm text-slate-400 text-center">
        Payment processing coming soon
      </p>
    </div>
  );
}
