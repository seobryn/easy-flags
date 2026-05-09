import { useState } from "react";
import { Icon } from "@/components/react/shared/Icon";
import { useTranslate, useLocalizedPath } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface ForgotPasswordFormProps {
  redirectUrl?: string;
  initialLocale?: AvailableLanguages;
}

export default function ForgotPasswordForm({ redirectUrl = "/spaces", initialLocale }: ForgotPasswordFormProps) {
  const t = useTranslate(initialLocale);
  const l = useLocalizedPath();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(t('auth.noResults')); // Reusing existing translation for "Please enter email"
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError(t('auth.networkDesync'));
        return;
      }

      if (!response.ok) {
        setError(data.error || data.message || t('auth.noResults'));
        return;
      }

      setSuccess(data.message || t('auth.passwordResetSuccess'));
    } catch (err) {
      setError(t('auth.terminalLinkLost'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
      {/* Aurora glow effect inside card */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/10 transition-colors duration-1000"></div>
      
      <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="text-red-500 shrink-0">
               <Icon name="AlertTriangle" size={18} />
            </div>
            <p className="text-red-400 font-bold text-xs tracking-tight">
              {error}
            </p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="text-green-500 shrink-0">
               <Icon name="Check" size={18} />
            </div>
            <p className="text-green-400 font-bold text-xs tracking-tight">
              {success}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="group/input">
            <label
              htmlFor="email"
              className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-cyan-400 transition-colors"
            >
              {t('auth.email')}
            </label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                 <Icon name="Mail" size={18} />
              </div>
              <input
                type="email"
                id="email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all shadow-inner"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-label="Send reset link"
          className="w-full btn-primary py-5! rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-black text-xs uppercase tracking-widest">{t('auth.sendResetLink')}</span>
              <Icon name="ArrowRight" size={16} />
            </>
          )}
        </button>

        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-slate-500 text-xs font-medium">
            {t('auth.backToLogin')}{" "}
            <a
              href={l("/login")}
              className="text-cyan-400 font-bold hover:text-white transition-colors underline underline-offset-4 decoration-cyan-500/30"
            >
              {t('auth.signIn')}
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}