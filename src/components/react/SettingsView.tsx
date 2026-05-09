import { useEffect, useState } from "react";
import { useTranslate, useLocalizedPath } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { SettingsSidebar } from "./settings/SettingsSidebar";
import { ProfileSection } from "./settings/ProfileSection";
import { BillingSection } from "./settings/BillingSection";
import { SecuritySection } from "./settings/SecuritySection";
import { ApiKeySection } from "./settings/ApiKeySection";
import { PreferenceSection } from "./settings/PreferenceSection";
import { SessionSection } from "./settings/SessionSection";
import { LimitsSection } from "./settings/LimitsSection";
import { Icon } from "@/components/react/shared/Icon";

interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
}

interface UserSubscription {
  id: number;
  user_id: number;
  pricing_plan_id: number;
  status: "active" | "canceled" | "past_due" | "trial";
  plan?: {
    name: string;
    description: string;
    slug?: string;
  };
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

interface SettingsViewProps {
  initialLocale?: AvailableLanguages;
}

export default function SettingsView({ initialLocale }: SettingsViewProps) {
  const t = useTranslate(initialLocale);
  const l = useLocalizedPath();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "api-keys" | "preferences" | "sessions" | "billing" | "limits"
  >("profile");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form states
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "" as any,
    newPassword: "" as any,
    confirmPassword: "" as any,
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
    fetchSubscription();
    fetchApiKeys();
    fetchPreferences();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/pricing/subscription", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

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
      <div className="flex flex-col items-center justify-center py-48 gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/5 rounded-full blur-sm"></div>
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
            {t('common.fetching')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-24 relative overflow-x-hidden">
      {/* Aurora Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full -z-10 animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[100px] rounded-full -z-10 animate-pulse duration-[8s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-purple-500/5 blur-[150px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <header className="mb-12 animate-in slide-in-from-top-4 duration-500">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">
             {t('settings.title')}
             <span className="text-cyan-500">.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            {t('settings.subtitle') || "Configure your personal experience and manage account security."}
          </p>
        </header>

        {/* Status Messages */}
        <div className="fixed top-24 right-8 z-50 flex flex-col gap-3 pointer-events-none">
          {error && (
            <div className="bg-red-950/80 backdrop-blur-xl border border-red-500/30 px-6 py-4 rounded-2xl text-red-300 shadow-2xl shadow-red-500/10 flex items-center gap-3 animate-in fade-in slide-in-from-right-4 pointer-events-auto">
              <Icon name="AlertTriangle" size={20} />
              <p className="font-medium">{error}</p>
              <button onClick={() => setError("")} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                <Icon name="X" size={16} />
              </button>
            </div>
          )}
          {success && (
            <div className="bg-green-950/80 backdrop-blur-xl border border-green-500/30 px-6 py-4 rounded-2xl text-green-300 shadow-2xl shadow-green-500/10 flex items-center gap-3 animate-in fade-in slide-in-from-right-4 pointer-events-auto">
              <Icon name="Check" size={20} />
              <p className="font-medium">{success}</p>
              <button onClick={() => setSuccess("")} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                 <Icon name="X" size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 sticky top-32 animate-in slide-in-from-left-4 duration-500">
            <SettingsSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                t={t} 
            />
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 min-h-[600px]">
            {activeTab === "profile" && (
                <ProfileSection 
                    user={user}
                    subscription={subscription}
                    emailForm={emailForm}
                    setEmailForm={setEmailForm}
                    isUpdating={isUpdating}
                    handleEmailUpdate={handleEmailUpdate}
                    t={t}
                />
            )}
            {activeTab === "billing" && (
                <BillingSection 
                    subscription={subscription}
                    t={t}
                    l={l}
                />
            )}
            {activeTab === "limits" && (
                <LimitsSection
                    subscription={subscription}
                    t={t}
                />
            )}
            {activeTab === "security" && (
                <SecuritySection 
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    isUpdating={isUpdating}
                    handlePasswordUpdate={handlePasswordUpdate}
                    t={t}
                />
            )}
            {activeTab === "api-keys" && (
                <ApiKeySection 
                    apiKeys={apiKeys}
                    showNewApiKeyForm={showNewApiKeyForm}
                    setShowNewApiKeyForm={setShowNewApiKeyForm}
                    isUpdating={isUpdating}
                    handleCreateApiKey={handleCreateApiKey}
                    handleDeleteApiKey={handleDeleteApiKey}
                    t={t}
                />
            )}
            {activeTab === "preferences" && (
                <PreferenceSection 
                    preferences={preferences}
                    togglingPreference={togglingPreference}
                    handleTogglePreference={handleTogglePreference}
                    initialLocale={initialLocale}
                    t={t}
                />
            )}
            {activeTab === "sessions" && (
                <SessionSection 
                    user={user}
                    isRevokingTokens={isRevokingTokens}
                    handleRevokeMyTokens={handleRevokeMyTokens}
                    handleRevokeUserTokens={handleRevokeUserTokens}
                    revokeTargetUserId={revokeTargetUserId}
                    setRevokeTargetUserId={setRevokeTargetUserId}
                    revokeTargetUsername={revokeTargetUsername}
                    setRevokeTargetUsername={setRevokeTargetUsername}
                    setError={setError}
                    t={t}
                />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
