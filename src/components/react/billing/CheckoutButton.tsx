import { useState } from "react";
import type { PricingPlan } from "@domain/entities";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface CheckoutButtonProps {
  plan: PricingPlan;
  initialLocale?: AvailableLanguages;
}

export default function CheckoutButton({ plan, initialLocale }: CheckoutButtonProps) {
  const t = useTranslate(initialLocale);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!userResponse.ok) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      // Initialize checkout on backend
      const checkoutResponse = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planSlug: plan.slug,
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || t('billing.failedInitialize'));
      }

      const { data } = await checkoutResponse.json();

      // Inject Wompi script if not already present
      if (!window.WidgetCheckout) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.wompi.co/widget.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error(t('billing.scriptLoadError')));
          document.head.appendChild(script);
        });
      }

      // Configure Wompi Widget
      const checkout = new window.WidgetCheckout({
        currency: data.currency,
        amountInCents: data.amountInCents,
        publicKey: data.publicKey,
        reference: data.transaction.reference,
        signature: data.signature,
        redirectUrl: `${window.location.origin}/billing?payment=completed`,
      });

      // Open the widget
      checkout.open((result: any) => {
        const transaction = result.transaction;
        if (transaction.status === "APPROVED") {
          window.location.href = "/billing?status=success";
        } else if (transaction.status === "DECLINED") {
          alert(t('billing.paymentDeclined'));
        } else if (transaction.status === "ERROR") {
          alert(t('billing.paymentError'));
        }
      });
    } catch (error: any) {
      console.error("[Checkout Error]:", error);
      alert(error.message || t('billing.paymentError'));
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
          className="block w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
        >
          {t('auth.getStarted')}
        </a>
      </div>
    );
  }

  // Paid plans
  return (
    <div className="space-y-2 mb-6">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? t('billing.processing') : t('auth.getStarted')}
      </button>
    </div>
  );
}
