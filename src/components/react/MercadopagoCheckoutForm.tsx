"use client";

import React, { useState, useEffect } from "react";

interface MercadopagoCheckoutFormProps {
  planId: string;
  planTitle: string;
  amount: number;
}

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export default function MercadopagoCheckoutForm({
  planId,
  planTitle,
  amount,
}: MercadopagoCheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mp, setMp] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [cardholderName, setCardholderName] = useState("");
  const [identificationType, setIdentificationType] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    const publicKey = import.meta.env.PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      setError("Mercadopago public key not configured");
      return;
    }

    // Load MercadoPago SDK
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => {
      if (window.MercadoPago) {
        const mercadoPago = new window.MercadoPago(publicKey);
        setMp(mercadoPago);
        initializeCardFields(mercadoPago);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeCardFields = async (mercadoPago: any) => {
    try {
      // Create card fields
      const cardNumber = mercadoPago.fields.create("cardNumber", {
        placeholder: "Número de tarjeta",
      });
      cardNumber.mount("cardNumber");

      const expirationDate = mercadoPago.fields.create("expirationDate", {
        placeholder: "MM/YY",
      });
      expirationDate.mount("expirationDate");

      const securityCode = mercadoPago.fields.create("securityCode", {
        placeholder: "Código de seguridad",
      });
      securityCode.mount("securityCode");

      // Get identification types
      const identificationTypes = await mercadoPago.getIdentificationTypes();
      populateIdentificationTypes(identificationTypes);

      // Listen to card changes
      cardNumber.on("binChange", async (data: any) => {
        const { bin } = data;
        if (bin) {
          try {
            const { results } = await mercadoPago.getPaymentMethods({ bin });
            if (results && results.length > 0) {
              const paymentMethod = results[0];
              setPaymentMethodId(paymentMethod.id);

              // Update card field settings
              const settings = paymentMethod.settings[0];
              cardNumber.update({
                settings: settings.card_number,
              });
              securityCode.update({
                settings: settings.security_code,
              });

              // Get issuer info
              if (paymentMethod.additional_info_needed.includes("issuer_id")) {
                const issuers = await mercadoPago.getIssuers({
                  paymentMethodId: paymentMethod.id,
                  bin,
                });
                populateIssuers(issuers);
              }

              // Get installments
              const installmentOptions = await mercadoPago.getInstallments({
                amount: (amount / 100).toString(),
                bin,
                paymentTypeId: "credit_card",
              });
              if (installmentOptions[0]) {
                populateInstallments(installmentOptions[0].payer_costs);
              }
            }
          } catch (err) {
            console.error("Error getting payment methods:", err);
          }
        }
      });
    } catch (err) {
      console.error("Error initializing card fields:", err);
      setError("Error initializing payment form");
    }
  };

  const populateIdentificationTypes = (types: any[]) => {
    const select = document.getElementById(
      "identificationType",
    ) as HTMLSelectElement;
    if (select) {
      types.forEach((type) => {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.name;
        select.appendChild(option);
      });
    }
  };

  const populateIssuers = (issuers: any[]) => {
    const select = document.getElementById("issuer") as HTMLSelectElement;
    if (select) {
      select.innerHTML = "";
      issuers.forEach((issuer) => {
        const option = document.createElement("option");
        option.value = issuer.id;
        option.textContent = issuer.name;
        select.appendChild(option);
      });
    }
  };

  const populateInstallments = (installmentOptions: any[]) => {
    const select = document.getElementById("installments") as HTMLSelectElement;
    if (select) {
      select.innerHTML = "";
      installmentOptions.forEach((option) => {
        const optElement = document.createElement("option");
        optElement.value = option.installments;
        optElement.textContent = option.recommended_message;
        select.appendChild(optElement);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create card token
      if (!mp) {
        throw new Error("Payment system not initialized");
      }

      const cardToken = await mp.fields.createCardToken({
        cardholderName,
        identificationType,
        identificationNumber,
      });

      if (!cardToken.id) {
        throw new Error("Failed to create card token");
      }

      setToken(cardToken.id);

      // Send payment to backend
      const response = await fetch("/api/mercadopago/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: cardToken.id,
          payment_method_id: paymentMethodId,
          transaction_amount: amount / 100, // Convert cents to dollars
          installments: parseInt(installments.toString()) || 1,
          issuer_id: issuerId ? parseInt(issuerId) : undefined,
          payer: {
            email,
            identification: {
              type: identificationType,
              number: identificationNumber,
            },
          },
          description: `Subscription to ${planTitle} plan`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment processing failed");
      }

      // Redirect to success page
      if (data.status === "approved") {
        window.location.href = `/payment-success?collection=${data.id}`;
      } else if (data.status === "pending") {
        window.location.href = `/payment-success?collection=${data.id}&status=pending`;
      } else {
        throw new Error(data.status_detail || "Payment was not approved");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred during payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Card Number
        </label>
        <div
          id="cardNumber"
          className="border border-slate-700 rounded-lg p-3 bg-slate-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Expiration Date
          </label>
          <div
            id="expirationDate"
            className="border border-slate-700 rounded-lg p-3 bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Security Code
          </label>
          <div
            id="securityCode"
            className="border border-slate-700 rounded-lg p-3 bg-slate-800"
          />
        </div>
      </div>

      <input
        type="text"
        id="cardholderName"
        placeholder="Cardholder Name"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        required
        className="w-full border border-slate-700 rounded-lg p-3 bg-slate-800 text-white placeholder-slate-500"
      />

      <select
        id="identificationType"
        value={identificationType}
        onChange={(e) => setIdentificationType(e.target.value)}
        required
        className="w-full border border-slate-700 rounded-lg p-3 bg-slate-800 text-white"
      >
        <option value="">Select document type</option>
      </select>

      <input
        type="text"
        id="identificationNumber"
        placeholder="Document Number"
        value={identificationNumber}
        onChange={(e) => setIdentificationNumber(e.target.value)}
        required
        className="w-full border border-slate-700 rounded-lg p-3 bg-slate-800 text-white placeholder-slate-500"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border border-slate-700 rounded-lg p-3 bg-slate-800 text-white placeholder-slate-500"
      />

      <select
        id="issuer"
        value={issuerId}
        onChange={(e) => setIssuerId(e.target.value)}
        className="w-full border border-slate-700 rounded-lg p-3 bg-slate-800 text-white"
      >
        <option value="">Select issuer bank</option>
      </select>

      <select
        id="installments"
        value={installments}
        onChange={(e) => setInstallments(e.target.value)}
        className="w-full border border-slate-700 rounded-lg p-3 bg-slate-800 text-white"
      >
        <option value="1">1 installment</option>
      </select>

      <button
        type="submit"
        disabled={loading || !mp}
        className={`w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition ${
          loading || !mp ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
