import { useState } from "react";
import { Icon } from "@/components/react/shared/Icon";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface LoginFormProps {
  redirectUrl?: string;
  initialLocale?: AvailableLanguages;
}

export default function LoginForm({ redirectUrl = "/spaces", initialLocale }: LoginFormProps) {
  const t = useTranslate(initialLocale);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError(t('auth.credentialsRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const payload = { username, password, redirectUrl };
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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
        if (response.status === 403) {
           setError("IDENTITY NOT CLEARED: Account verification required. Please check your secure mailbox.");
        } else {
           setError(data.error || data.message || t('auth.authenticationFailed'));
        }
        return;
      }

      const finalRedirectUrl = data.data?.redirectUrl || redirectUrl;
      window.location.href = finalRedirectUrl;
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

        <div className="space-y-6">
          <div className="group/input">
            <label
              htmlFor="username"
              className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-cyan-400 transition-colors"
            >
              {t('auth.identityHash')}
            </label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                 <Icon name="User" size={18} />
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all shadow-inner"
                placeholder={t('auth.networkIdentifier')}
              />
            </div>
          </div>

          <div className="group/input">
            <label
              htmlFor="password"
              className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-purple-400 transition-colors"
            >
              {t('auth.accessCryptogram')}
            </label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors">
                 <Icon name="Lock" size={18} />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all shadow-inner"
                placeholder="••••••••••••"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-5! rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-black text-xs uppercase tracking-widest">{t('auth.authorizeAccess')}</span>
              <Icon name="ArrowRight" size={16} />
            </>
          )}
        </button>

        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-slate-500 text-xs font-medium">
            {t('auth.newOperative')}{" "}
            <a
              href="/create-account"
              className="text-cyan-400 font-bold hover:text-white transition-colors underline underline-offset-4 decoration-cyan-500/30"
            >
              {t('auth.initializeProfile')}
            </a>
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 transition-colors">{t('auth.protocolReset')}</a>
            <a href="#" className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 transition-colors">{t('auth.systemStatus')}</a>
          </div>
        </div>
      </form>
    </div>
  );
}
