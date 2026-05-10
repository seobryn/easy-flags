import { useState } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import { Icon } from "@/components/react/shared/Icon";
import { useAuth } from "@/infrastructure/auth/context";
import { useApi } from "@/infrastructure/api/context";

const AcceptInvitation = () => {
  const { t } = useTranslate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isApiLoading, isError: isApiError, data: apiData, post } = useApi();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [hasAccount, setHasAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleAcceptInvitation = async () => {
  if (!token) {
    setError(t("invite.tokenRequired"));
    return;
  }

  try {
    if (hasAccount) {
      await post("/api/accept-invite", { token });
    } else {
      await post("/api/accept-invite", { token, username, email, password });
    }
    // Assume the API returns a success message or user data
    setError("");
  } catch (err) {
    setError(err.message || t("invite.acceptError"));
  }
};

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white tracking-tight">{t("invite.acceptTitle")}</h2>
      <p className="text-slate-400 text-sm leading-relaxed">{t("invite.acceptDescription")}</p>
      {isAuthLoading || isApiLoading ? (
        <div className="flex items-center gap-3 mt-4">
          <Icon name="Loader" size={24} className="animate-spin" />
          <span>{t("invite.loading")}</span>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {apiData && apiData.message && <p className="text-green-500 text-sm">{apiData.message}</p>}
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t("invite.tokenPlaceholder")}
            className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasAccount"
              checked={hasAccount}
              onChange={(e) => setHasAccount(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="hasAccount" className="block text-sm text-white">
              {t("invite.hasAccount")}
            </label>
          </div>
          {!hasAccount && (
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("invite.usernamePlaceholder")}
                className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("invite.emailPlaceholder")}
                className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("invite.passwordPlaceholder")}
                className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              />
            </div>
          )}
          <button
            onClick={handleAcceptInvitation}
            className="btn-primary w-full py-3 mt-2"
          >
            {t("invite.acceptButton")}
          </button>
        </div>
      )}
    </div>
  );
};

export default AcceptInvitation;