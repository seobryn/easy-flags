import React, { useState } from "react";

interface BillingPlan {
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export default function BillingPanel() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const plans: BillingPlan[] = [
    {
      name: "Starter",
      price: 29,
      features: [
        "Up to 1,000 monthly flag evaluations",
        "2 team members",
        "Basic analytics",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: 99,
      features: [
        "Up to 100,000 monthly flag evaluations",
        "10 team members",
        "Advanced analytics",
        "Priority email support",
        "Custom integrations",
      ],
      recommended: true,
    },
    {
      name: "Enterprise",
      price: 299,
      features: [
        "Unlimited flag evaluations",
        "Unlimited team members",
        "Advanced analytics & reports",
        "24/7 phone & email support",
        "Custom integrations",
        "SLA guarantee",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setBillingPeriod("monthly")}
          className={`px-6 py-2 rounded-lg transition ${
            billingPeriod === "monthly"
              ? "bg-cyan-500 text-white"
              : "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod("yearly")}
          className={`px-6 py-2 rounded-lg transition ${
            billingPeriod === "yearly"
              ? "bg-cyan-500 text-white"
              : "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          }`}
        >
          Yearly <span className="text-xs text-cyan-300 ml-1">(Save 20%)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`border rounded-xl p-8 transition ${
              plan.recommended
                ? "border-cyan-500/80 bg-gradient-to-b from-cyan-500/10 to-slate-800/50 ring-2 ring-cyan-500/30 scale-105"
                : "border-slate-700 bg-slate-800/50 hover:border-cyan-500/30"
            }`}
          >
            {plan.recommended && (
              <div className="mb-4 text-sm font-semibold text-cyan-400 bg-cyan-500/10 w-fit px-3 py-1 rounded-full">
                Recommended
              </div>
            )}

            <h3 className="text-2xl font-bold text-cyan-300 mb-2">
              {plan.name}
            </h3>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">
                ${plan.price}
              </span>
              <span className="text-slate-400">
                /{billingPeriod === "monthly" ? "month" : "year"}
              </span>
            </div>

            <button className="w-full btn-primary mb-6">Get Started</button>

            <div className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex gap-2 items-start">
                  <svg
                    className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card text-center">
        <h3 class="text-xl font-bold text-cyan-300 mb-2">Custom Plan</h3>
        <p class="text-slate-400 mb-4">
          Need something different? Contact our sales team for a custom plan
          tailored to your needs.
        </p>
        <a href="/contact" class="text-cyan-400 hover:text-cyan-300 transition">
          Get in touch →
        </a>
      </div>
    </div>
  );
}
