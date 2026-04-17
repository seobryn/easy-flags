import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { PricingPlan } from "@domain/entities";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "../shared/Icon";
import { BillingInput } from "./BillingInput";
import { BillingSelector } from "./BillingSelector";
import { BillingStepper } from "./BillingStepper";
import { PhonePrefixSelector } from "./PhonePrefixSelector";

interface CheckoutButtonProps {
  plan: PricingPlan;
  initialLocale?: AvailableLanguages;
}

interface CustomerDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  initialLocale?: AvailableLanguages;
  acceptanceData?: {
    acceptanceToken: string;
    acceptanceText: string;
    dataPrivacyToken: string;
    dataPrivacyText: string;
  };
}

function CustomerDataModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialLocale,
  acceptanceData,
}: CustomerDataModalProps) {
  const t = useTranslate(initialLocale);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    phoneNumberPrefix: "+57",
    legalId: "",
    legalIdType: "CC",
    addressLine1: "",
    country: "CO",
    city: "",
    region: "",
    regionCode: "",
    cardHolder: "",
    cardNumber: "",
    cvv: "",
    expiryMonth: "",
    expiryYear: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep(1);
      loadCountries();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadCountries = async () => {
    try {
      const res = await fetch("/api/system/geo?type=countries");
      const result = await res.json();
      if (result.success) {
        setCountries(result.data);
        // Default country CO
        loadStates("CO");
      }
    } catch (e) {
      console.error("Error loading countries", e);
    }
  };

  const loadStates = async (countryCode: string) => {
    setLoadingGeo(true);
    try {
      const res = await fetch(`/api/system/geo?type=states&countryCode=${countryCode}`);
      const result = await res.json();
      if (result.success) {
        setStates(result.data);
        setCities([]);
      }
    } catch (e) {
      console.error("Error loading states", e);
    } finally {
      setLoadingGeo(false);
    }
  };

  const loadCities = async (countryCode: string, stateCode: string) => {
    setLoadingGeo(true);
    try {
      const res = await fetch(`/api/system/geo?type=cities&countryCode=${countryCode}&stateCode=${stateCode}`);
      const result = await res.json();
      if (result.success) {
        setCities(result.data);
      }
    } catch (e) {
      console.error("Error loading cities", e);
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleCountryChange = (code: string) => {
    const country = countries.find(c => c.code === code);
    const phonePrefix = country ? `+${country.phoneCode.replace("+", "")}` : "+57";
    
    setFormData({ 
      ...formData, 
      country: code, 
      phoneNumberPrefix: phonePrefix,
      region: "", 
      regionCode: "", 
      city: "" 
    });
    loadStates(code);
  };

  const handleStateChange = (code: string, name: string) => {
    setFormData({ ...formData, region: name, regionCode: code, city: "" });
    loadCities(formData.country, code);
  };

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      if (!formData.acceptTerms || !formData.acceptPrivacy) {
        alert("Debes aceptar los términos y el tratamiento de datos para continuar.");
        return;
      }
      onSubmit(formData);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#06080f]/80 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-[#0b0e14]/95 border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full flex flex-col animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-linear-to-r from-transparent via-cyan-500/50 to-transparent"></div>

        <div className="shrink-0 p-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {step === 1
                  ? t("billing.customerDataTitle")
                  : step === 2 
                    ? t("billing.billingAddressTitle")
                    : t("billing.paymentMethodTitle")}
              </h2>
              {step === 3 && (
                <div className="px-2 py-1 bg-white/10 rounded-lg border border-white/10 flex items-center">
                  <img 
                    src="https://wompi.com/assets/downloadble/logos_wompi/Wompi_ContraccionPrincipal.svg" 
                    alt="Wompi" 
                    className="h-5 brightness-0 invert opacity-90"
                  />
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              {step === 1
                ? t("billing.customerDataSubtitle")
                : step === 2
                  ? t("billing.billingAddressSubtitle")
                  : t("billing.paymentMethodSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all"
          >
            <Icon name="X" size={16} strokeWidth={3} />
          </button>
        </div>

        <BillingStepper currentStep={step} totalSteps={3} />

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          <div className="space-y-6">
            {step === 1 ? (
              <>
                <BillingInput
                  label={t("billing.phoneNumber")}
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="3001234567"
                  prefix={
                    <PhonePrefixSelector
                      countries={countries}
                      selectedCountry={formData.country}
                      phonePrefix={formData.phoneNumberPrefix}
                      onCountryChange={handleCountryChange}
                      initialLocale={initialLocale}
                    />
                  }
                />

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <BillingSelector
                      label={t("billing.legalIdType")}
                      value={formData.legalIdType}
                      onChange={(val) => setFormData({ ...formData, legalIdType: val })}
                      initialLocale={initialLocale}
                      options={[
                        { value: "CC", label: "CC" },
                        { value: "CE", label: "CE" },
                        { value: "NIT", label: "NIT" },
                        { value: "PP", label: "PP" },
                        { value: "TI", label: "TI" },
                        { value: "DNI", label: "DNI" },
                        { value: "RG", label: "RG" },
                        { value: "CPF", label: "CPF" },
                      ]}
                    />
                  </div>
                  <div className="col-span-2">
                    <BillingInput
                      label={t("billing.legalId")}
                      icon="CreditCard"
                      required
                      value={formData.legalId}
                      onChange={(e) => setFormData({ ...formData, legalId: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                </div>
              </>
            ) : step === 2 ? (
              <>
                <BillingSelector
                  label={t("billing.countryLabel")}
                  searchable
                  value={formData.country}
                  onChange={(val) => handleCountryChange(val)}
                  initialLocale={initialLocale}
                  options={countries.map(c => ({ value: c.code, label: c.name, flag: c.flag }))}
                />

                <BillingInput
                  label={t("billing.addressLabel")}
                  icon="MapPin"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="Calle 123 # 45-67"
                />

                <div className="grid grid-cols-2 gap-6">
                  <BillingSelector
                    label={formData.country === "CO" ? t("billing.regionLabelCO") : t("billing.regionLabel")}
                    searchable
                    loading={loadingGeo}
                    disabled={loadingGeo || states.length === 0}
                    value={formData.regionCode}
                    placeholder={t("billing.selectPlaceholder")}
                    onChange={(val, label) => handleStateChange(val, label)}
                    initialLocale={initialLocale}
                    options={states.map(s => ({ value: s.code, label: s.name }))}
                  />
                  <BillingSelector
                    label={t("billing.cityLabel")}
                    searchable
                    loading={loadingGeo}
                    disabled={loadingGeo || cities.length === 0}
                    value={formData.city}
                    placeholder={t("billing.selectPlaceholder")}
                    onChange={(val) => setFormData({ ...formData, city: val })}
                    initialLocale={initialLocale}
                    options={cities.map(c => ({ value: c.name, label: c.name }))}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <BillingInput
                  label={t("billing.cardHolder")}
                  required
                  value={formData.cardHolder}
                  onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                />
                
                <BillingInput
                  label={t("billing.cardNumber")}
                  required
                  maxLength={19}
                  placeholder="4242 4242 4242 4242"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s]/g, "");
                    const formatted = val.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
                    setFormData({ ...formData, cardNumber: formatted });
                  }}
                  prefix={
                    <div className="flex gap-2 opacity-80 h-full items-center pl-2 pr-4 border-r border-white/5 mr-4">
                      <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@master/flat/visa.svg" alt="Visa" className="h-4" />
                      <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@master/flat/mastercard.svg" alt="Mastercard" className="h-4" />
                      <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@master/flat/amex.svg" alt="Amex" className="h-4" />
                    </div>
                  }
                  className="pl-36!"
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <BillingInput
                      label={t("billing.cvv")}
                      required
                      maxLength={4}
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <BillingInput
                      label={t("billing.monthLabel")}
                      required
                      maxLength={2}
                      placeholder="MM"
                      value={formData.expiryMonth}
                      onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value.replace(/\D/g, "") })}
                    />
                    <BillingInput
                      label={t("billing.yearLabel")}
                      required
                      maxLength={4}
                      placeholder="YY"
                      value={formData.expiryYear}
                      onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                </div>

                {acceptanceData && (
                  <div className="space-y-3 pt-3">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="acceptTerms" 
                        required
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="mt-1 accent-cyan-500 w-4 h-4"
                      />
                      <label htmlFor="acceptTerms" className="text-[10px] text-slate-400 leading-relaxed">
                        {t("billing.termsAcceptance").split("{terms}")[0]}
                        <a href={acceptanceData.acceptanceText} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
                          {t("billing.termsLink") || "Términos y Condiciones"}
                        </a>
                        {t("billing.termsAcceptance").split("{terms}")[1]}
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="acceptPrivacy" 
                        required
                        checked={formData.acceptPrivacy}
                        onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                        className="mt-1 accent-cyan-500 w-4 h-4"
                      />
                      <label htmlFor="acceptPrivacy" className="text-[10px] text-slate-400 leading-relaxed">
                        {t("billing.privacyAcceptance").split("{privacy}")[0]}
                        <a href={acceptanceData.dataPrivacyText} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
                          {t("billing.privacyLink") || "Tratamiento de Datos Personales"}
                        </a>
                        {t("billing.privacyAcceptance").split("{privacy}")[1]}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1 py-3.5 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                {t("billing.back")}
              </button>
            )}
            {step < 3 ? (
              <>
                {step === 1 && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-3.5 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                  >
                    {t("billing.close")}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-2xl transition shadow-lg shadow-cyan-500/20"
                >
                  {t("billing.next")}
                </button>
              </>
            ) : (
              <div className="flex-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-2xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      {t("billing.processing")}
                    </span>
                  ) : (
                    t("billing.payNow")
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-[8px] text-slate-500 uppercase tracking-tighter">
                  <Icon name="Lock" size={8} />
                  <span>{t("billing.securePayment")}</span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function CheckoutButton({
  plan,
  initialLocale,
}: CheckoutButtonProps) {
  const t = useTranslate(initialLocale);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acceptanceData, setAcceptanceData] = useState<any>(null);
  const [initData, setInitData] = useState<any>(null);

  const handleCheckoutClick = async () => {
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

      // If it's a paid plan, show the modal
      if (plan.price_usd > 0) {
        // Pre-fetch acceptance info and init payment
        const checkoutResponse = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planSlug: plan.slug,
          }),
        });

        const result = await checkoutResponse.json();
        if (checkoutResponse.ok) {
          setInitData(result.data);
          setAcceptanceData(result.data.acceptance);
        }

        setIsModalOpen(true);
        setLoading(false);
        return;
      }

      // For free plans
      window.location.href = "/spaces";
    } catch (error: any) {
      console.error("[Checkout Error]:", error);
      alert(error.message || t("billing.paymentError"));
      setLoading(false);
    }
  };

  const proceedToCheckout = async (formData: any) => {
    setLoading(true);
    try {
      let data = initData;

      // If we don't have init data (maybe it failed during opening), try again
      if (!data) {
        const checkoutResponse = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planSlug: plan.slug,
            phoneNumber: formData.phoneNumber,
            phoneNumberPrefix: "+57",
            legalId: formData.legalId,
            legalIdType: formData.legalIdType,
            addressLine1: formData.addressLine1,
            city: formData.city,
            region: formData.region,
          }),
        });

        const result = await checkoutResponse.json();
        if (!checkoutResponse.ok) {
          throw new Error(result.error || t("billing.failedInitialize"));
        }
        data = result.data;
      }

      // 1. Tokenize card with Wompi Direct API
      const isProd = !data.publicKey.startsWith("pub_test_");
      const tokenBaseUrl = isProd 
        ? "https://production.wompi.co/v1" 
        : "https://sandbox.wompi.co/v1";

      const cleanNumber = formData.cardNumber.replace(/\s+/g, "").replace(/\D/g, "");
      const cleanCvc = formData.cvv.replace(/\D/g, "");
      const cleanMonth = formData.expiryMonth.replace(/\D/g, "").padStart(2, "0");
      const cleanYear = formData.expiryYear.replace(/\D/g, "").slice(-2);

      // Simple Luhn Algorithm Check
      const isLuhnValid = (num: string) => {
        let sum = 0;
        for (let i = 0; i < num.length; i++) {
          let digit = parseInt(num[num.length - 1 - i]);
          if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
        }
        return sum % 10 === 0;
      };

      console.log("[Wompi Debug] Payload Preview:", {
        numberPrefix: cleanNumber.substring(0, 4),
        length: cleanNumber.length,
        luhnLocal: isLuhnValid(cleanNumber),
        publicKey: data.publicKey.substring(0, 15) + "...",
        env: data.publicKey.startsWith("pub_test") ? "SANDBOX" : "PROD"
      });

      if (cleanNumber.length < 15 || cleanNumber.length > 16) {
        throw new Error(`El número de tarjeta debe tener 15 o 16 dígitos (tienes ${cleanNumber.length}).`);
      }

      if (!isLuhnValid(cleanNumber)) {
        throw new Error("El número de tarjeta no pasa la validación de Luhn (algoritmo de tarjeta inválido). Revisa que lo hayas copiado bien.");
      }

      const tokenizeResponse = await fetch(`${tokenBaseUrl}/tokens/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.publicKey}`,
        },
        body: JSON.stringify({
          number: cleanNumber,
          cvc: cleanCvc,
          exp_month: cleanMonth,
          exp_year: cleanYear,
          card_holder: formData.cardHolder.trim(),
        }),
      });

      const tokenResult = await tokenizeResponse.json();
      if (!tokenizeResponse.ok) {
        console.error("[Tokenization Failed Full Result]:", tokenResult);
        
        const errorMapping: Record<string, string> = {
          'invalid_card_data': 'Los datos de la tarjeta son inválidos.',
          'invalid_request_error': 'Error en la petición de pago.',
          'card_not_supported': 'La tarjeta no es soportada.',
          'network_error': 'Error de red al procesar la tarjeta.',
          'not_found': 'Recurso no encontrado.',
          'internal_server_error': 'Error interno del servidor de pagos.',
        };

        let errorMessage = errorMapping[tokenResult.error?.reason] || tokenResult.error?.reason || "Error al tokenizar la tarjeta.";
        
        if (tokenResult.error?.messages) {
          const detailedMessages = Object.entries(tokenResult.error.messages)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
            .join(". ");
          if (detailedMessages) {
            errorMessage = `${errorMessage} Detalle: ${detailedMessages}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const cardToken = tokenResult.data.id;

      // 2. Confirm payment on backend
      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: cardToken,
          acceptance_token: data.acceptance.acceptanceToken,
          personal_data_auth_token: data.acceptance.dataPrivacyToken,
          reference: data.transaction.reference,
          amountInCents: data.amountInCents,
          currency: data.currency,
          customerData: {
            ...data.customer,
            phoneNumber: formData.phoneNumber,
            phoneNumberPrefix: formData.phoneNumberPrefix,
            legalId: formData.legalId,
            legalIdType: formData.legalIdType,
          },
          shippingAddress: {
            addressLine1: formData.addressLine1,
            city: formData.city,
            phoneNumber: formData.phoneNumber,
            region: formData.region,
            country: formData.country,
          },
        }),
      });

      const confirmResult = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmResult.error || "Error al procesar el pago.");
      }

      const transaction = confirmResult.data;
      if (transaction.status === "APPROVED") {
        window.location.href = `/payment-result?status=success&id=${transaction.id}`;
      } else if (transaction.status === "PENDING") {
        window.location.href = `/payment-result?status=pending&id=${transaction.id}`;
      } else {
        window.location.href = `/payment-result?status=error&id=${transaction.id}`;
      }

      setIsModalOpen(false);
    } catch (error: any) {
      console.error("[Checkout Error]:", error);
      alert(error.message || t("billing.paymentError"));
    } finally {
      setLoading(false);
    }
  };

  // Paid plans
  return (
    <div className="space-y-2 mb-6">
      <button
        onClick={handleCheckoutClick}
        disabled={loading}
        className={`w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? t("billing.processing") : t("auth.getStarted")}
      </button>

      <CustomerDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={proceedToCheckout}
        loading={loading}
        initialLocale={initialLocale}
        acceptanceData={acceptanceData}
      />
    </div>
  );
}
