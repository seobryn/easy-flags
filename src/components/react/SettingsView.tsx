import { useEffect, useState } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
}

interface ApiKey {
  id: number;
  key: string;
  last_used?: string;
  created_at: string;
}

interface UserPreferences {
  id: number;
  user_id: number;
  email_notifications: boolean;
  security_alerts: boolean;
  created_at: string;
  updated_at: string;
}

// Toggle Component
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled = false,
  loading = false,
}: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled && !loading) onChange(!checked);
      }}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked
          ? "bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/25"
          : "bg-white/10 hover:bg-white/20"
      } ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-3 w-3 border-2 border-transparent border-t-white rounded-full"></div>
        </div>
      )}
    </button>
  );
}

interface SettingsViewProps {
  initialLocale?: AvailableLanguages;
}

export default function SettingsView({ initialLocale }: SettingsViewProps) {
  const t = useTranslate(initialLocale);
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "api-keys" | "preferences" | "sessions"
  >("profile");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form states
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);
  const [togglingPreference, setTogglingPreference] = useState<string | null>(
    null,
  );
  const [isRevokingTokens, setIsRevokingTokens] = useState(false);
  const [revokeTargetUserId, setRevokeTargetUserId] = useState("");
  const [revokeTargetUsername, setRevokeTargetUsername] = useState("");

  useEffect(() => {
    fetchUser();
    fetchApiKeys();
    fetchPreferences();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setEmailForm({ email: data.data.email });
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setError(t('common.noResults'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/auth/api-keys", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/auth/preferences", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailForm.email }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(t('common.updated'));
        if (user) {
          setUser({ ...user, email: emailForm.email });
        }
      } else {
        setError(data.error || t('common.noResults'));
      }
    } catch (error) {
      console.error("Error updating email:", error);
      setError(t('common.noResults'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('auth.noMatchPass'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError(t('auth.shortPass'));
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(t('common.updated'));
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(data.error || t('common.noResults'));
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setError(t('common.noResults'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsUpdating(true);

    try {
      const response = await fetch("/api/auth/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(t('common.created'));
        setShowNewApiKeyForm(false);
        fetchApiKeys();
      } else {
        setError(data.error || t('common.noResults'));
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      setError(t('common.noResults'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteApiKey = async (keyId: number) => {
    if (!confirm(t('common.confirmDeletion'))) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/auth/api-keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setSuccess(t('common.deleted'));
        fetchApiKeys();
      } else {
        const data = await response.json();
        setError(data.error || t('common.noResults'));
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      setError(t('common.noResults'));
    }
  };

  const handleTogglePreference = async (
    preferenceKey: "email_notifications" | "security_alerts",
    newValue: boolean,
  ) => {
    setTogglingPreference(preferenceKey);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          [preferenceKey]: newValue,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPreferences(data.data);
        setSuccess(t('common.updated'));
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(data.error || t('common.noResults'));
      }
    } catch (error) {
      console.error("Error updating preference:", error);
      setError(t('common.noResults'));
    } finally {
      setTogglingPreference(null);
    }
  };

  const handleRevokeMyTokens = async () => {
    if (
      !confirm(
        t('settings.revokeDesc'),
      )
    ) {
      return;
    }

    setIsRevokingTokens(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(t('common.updated'));
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(data.message || t('common.noResults'));
      }
    } catch (error) {
      console.error("Error revoking tokens:", error);
      setError(t('common.noResults'));
    } finally {
      setIsRevokingTokens(false);
    }
  };

  const handleRevokeUserTokens = async (userId: number) => {
    const username = revokeTargetUsername || `${t('settings.userId')} ${userId}`;
    if (!confirm(t('settings.confirmRevokeUser', { username }))) {
      return;
    }

    setIsRevokingTokens(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/revoke-user-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(t('settings.tokensRevoked', { username }));
        setRevokeTargetUserId("");
        setRevokeTargetUsername("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || t('settings.failedRevokeTokens'));
      }
    } catch (error) {
      console.error("Error revoking user tokens:", error);
      setError(t('settings.failedRevokeTokens'));
    } finally {
      setIsRevokingTokens(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('common.fetching')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold text-gradient mb-8">{t('settings.title')}</h1>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg text-green-300">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {(
            [
              { id: "profile", label: t('settings.profile') },
              { id: "security", label: t('settings.security') },
              { id: "api-keys", label: t('settings.apiKeys') },
              { id: "preferences", label: t('settings.preferences') },
              { id: "sessions", label: t('settings.sessions') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-cyan-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-cyan-300 mb-6">
                {t('settings.profileInfo')}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {t('settings.username')}
                    </label>
                    <div className="text-slate-100 mt-2 font-medium">
                      {user?.username}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {t('settings.emailAddress')}
                    </label>
                    <div className="text-slate-100 mt-2 font-medium">
                      {user?.email}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {t('settings.memberSince')}
                    </label>
                    <div className="text-slate-100 mt-2 font-medium">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : t('common.noResults')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Update */}
            <div className="card">
              <h2 className="text-2xl font-bold text-cyan-300 mb-6">
                {t('settings.updateEmail')}
              </h2>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-300 block mb-2"
                  >
                    {t('settings.newEmail')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition"
                    placeholder="your.email@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
                >
                  {isUpdating ? t('settings.updating') : t('settings.updateButton')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="card">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">
              {t('settings.changePassword')}
            </h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-semibold text-slate-300 block mb-2"
                >
                  {t('settings.currentPassword')}
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition"
                  placeholder={t('settings.currentPasswordPlaceholder')}
                />
              </div>
              <div className="border-t border-slate-700 pt-5">
                <label
                  htmlFor="newPassword"
                  className="text-sm font-semibold text-slate-300 block mb-2"
                >
                  {t('settings.newPassword')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition"
                  placeholder={t('settings.newPasswordPlaceholder')}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-300 block mb-2"
                >
                  {t('settings.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition"
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
              >
                {isUpdating ? t('settings.updating') : t('settings.changePasswordButton')}
              </button>
            </form>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-300">{t('settings.apiKeysTitle')}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {t('settings.apiKeysDesc')}
                  </p>
                </div>
                {!showNewApiKeyForm && (
                  <button
                    onClick={() => setShowNewApiKeyForm(true)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition font-medium"
                  >
                    {t('common.create')}
                  </button>
                )}
              </div>

              {showNewApiKeyForm && (
                <div className="card mb-6">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4">
                    {t('settings.createNewApiKey')}
                  </h3>
                  <form onSubmit={handleCreateApiKey} className="space-y-4">
                    <div className="p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
                      <p className="text-sm text-cyan-200">
                        {t('settings.apiKeySecurityNotice')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
                      >
                        {isUpdating ? t('common.loading') : t('settings.generateKey')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewApiKeyForm(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {apiKeys.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-slate-400 font-medium">{t('settings.noApiKeys')}</p>
                <p className="text-slate-500 text-sm mt-1">
                  {t('settings.noApiKeysDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="card flex justify-between items-start hover:border-cyan-600/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-cyan-400 bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {key.key}
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500 mt-3">
                        <span>
                          📅 {t('settings.createdLabel')}:{" "}
                          {new Date(key.created_at).toLocaleDateString()}
                        </span>
                        {key.last_used && (
                          <span>
                            🕐 {t('settings.lastUsedLabel')}:{" "}
                            {new Date(key.last_used).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="ml-4 px-3 py-1 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 rounded transition text-sm font-medium shrink-0"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-300">
                    {t('settings.preferences')}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {t('settings.preferencesDesc')}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Language Selection */}
                <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-700 transition">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-100 text-base">
                      🌐 {t('settings.language')}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {t('settings.languageDesc')}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 flex gap-2">
                    {(['en', 'es', 'fr'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          document.cookie = `lang=${lang}; path=/; max-age=31536000`;
                          window.location.reload();
                        }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          (initialLocale || 'en') === lang
                            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-cyan-300"
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {preferences && (
                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-700 transition">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100 text-base">
                          📧 {t('settings.emailNotifications')}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {t('settings.emailNotificationsDesc')}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <Toggle
                          checked={preferences.email_notifications}
                          onChange={(value) =>
                            handleTogglePreference("email_notifications", value)
                          }
                          loading={togglingPreference === "email_notifications"}
                        />
                      </div>
                    </div>

                    {/* Security Alerts */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-700 transition">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100 text-base">
                          🔒 {t('settings.securityAlerts')}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {t('settings.securityAlertsDesc')}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <Toggle
                          checked={preferences.security_alerts}
                          onChange={(value) =>
                            handleTogglePreference("security_alerts", value)
                          }
                          loading={togglingPreference === "security_alerts"}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className="card opacity-60 pointer-events-none">
              <h3 className="font-semibold text-slate-400 mb-4">{t('settings.comingSoon')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-sm">
                      🔐 {t('settings.tfa')}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    2FA
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-sm">
                      🌙 {t('settings.darkMode')}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Theme
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            {/* Revoke My Tokens */}
            <div className="card border-l-4 border-orange-500/50">
              <h2 className="text-2xl font-bold text-orange-400 mb-2">
                🔐 {t('settings.activeSessions')}
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                {t('settings.activeSessionsDesc')}
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-3">
                    {t('settings.currentSession')}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t('settings.status')}</span>
                      <span className="text-green-400 font-medium">{t('settings.active')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t('settings.username')}</span>
                      <span className="text-cyan-300">{user?.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t('settings.loginTime')}</span>
                      <span className="text-slate-300">
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRevokeMyTokens}
                  disabled={isRevokingTokens}
                  className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  {isRevokingTokens ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-transparent border-t-white rounded-full"></div>
                      {t('settings.revoking')}
                    </>
                  ) : (
                    <>
                      <span>🚪</span>
                      {t('settings.revokeAllSessions')}
                    </>
                  )}
                </button>

                <div className="p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
                  <p className="text-xs text-orange-200">
                    {t('settings.revokeAllNotice')}
                  </p>
                </div>
              </div>
            </div>

            {/* Super User Token Revocation */}
            {user && user.role_id === 1 && (
              <div className="card border-l-4 border-red-500/50">
                <h2 className="text-2xl font-bold text-red-400 mb-2">
                  🔑 {t('settings.adminRevokeTitle')}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  {t('settings.adminRevokeDesc')}
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-red-900/10 border border-red-700/30 rounded-lg">
                    <p className="text-sm text-red-300">
                      {t('settings.adminRevokeNotice')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="userId"
                        className="text-sm font-semibold text-slate-300 block mb-2"
                      >
                        {t('settings.userId')}
                      </label>
                      <input
                        id="userId"
                        type="number"
                        value={revokeTargetUserId}
                        onChange={(e) => setRevokeTargetUserId(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition"
                        placeholder={t('settings.userIdPlaceholder')}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="username"
                        className="text-sm font-semibold text-slate-300 block mb-2"
                      >
                        {t('settings.usernameLabel')}
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={revokeTargetUsername}
                        onChange={(e) =>
                          setRevokeTargetUsername(e.target.value)
                        }
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition"
                        placeholder={t('settings.usernamePlaceholder')}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!revokeTargetUserId) {
                        setError(t('settings.enterValidUserId'));
                        return;
                      }
                      handleRevokeUserTokens(parseInt(revokeTargetUserId, 10));
                    }}
                    disabled={isRevokingTokens || !revokeTargetUserId}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                  >
                    {isRevokingTokens ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-transparent border-t-white rounded-full"></div>
                        {t('settings.revoking')}
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        {t('settings.revokeUserTokens')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="card bg-slate-800/20 border-l-4 border-cyan-500/50">
              <h3 className="font-semibold text-cyan-300 mb-3">
                ℹ️ {t('settings.howRevocationWorks')}
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  ✅ {t('settings.revocationStep1')}
                </li>
                <li>
                  ✅ {t('settings.revocationStep2')}
                </li>
                <li>✅ {t('settings.revocationStep3')}</li>
                <li>
                  ✅ {t('settings.revocationStep4')}
                </li>
                <li>
                  ⏰ {t('settings.revocationStep5')}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
