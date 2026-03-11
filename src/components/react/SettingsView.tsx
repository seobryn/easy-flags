import React, { useEffect, useState } from "react";

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
          ? "bg-cyan-600 hover:bg-cyan-700"
          : "bg-slate-700 hover:bg-slate-600"
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
          <div className="animate-spin h-4 w-4 border-2 border-transparent border-t-cyan-500 rounded-full"></div>
        </div>
      )}
    </button>
  );
}

export default function SettingsView() {
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "api-keys" | "preferences"
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
      setError("Failed to load user settings");
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
        setSuccess("Email updated successfully");
        if (user) {
          setUser({ ...user, email: emailForm.email });
        }
      } else {
        setError(data.error || "Failed to update email");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      setError("Failed to update email");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
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
        setSuccess("Password updated successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setError("Failed to update password");
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
        setSuccess("API key created successfully");
        setShowNewApiKeyForm(false);
        fetchApiKeys();
      } else {
        setError(data.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      setError("Failed to create API key");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteApiKey = async (keyId: number) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
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
        setSuccess("API key deleted successfully");
        fetchApiKeys();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      setError("Failed to delete API key");
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
        setSuccess("Preference updated");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(data.error || "Failed to update preference");
      }
    } catch (error) {
      console.error("Error updating preference:", error);
      setError("Failed to update preference");
    } finally {
      setTogglingPreference(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold text-gradient mb-8">Settings</h1>

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
              { id: "profile", label: "Profile" },
              { id: "security", label: "Security" },
              { id: "api-keys", label: "API Keys" },
              { id: "preferences", label: "Preferences" },
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
                Profile Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Username
                    </label>
                    <div className="text-slate-100 mt-2 font-medium">
                      {user?.username}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      User ID
                    </label>
                    <div className="text-slate-100 mt-2 font-medium">
                      #{user?.id}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="text-slate-100 mt-2 font-medium">
                      {user?.email}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Member Since
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
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Update */}
            <div className="card">
              <h2 className="text-2xl font-bold text-cyan-300 mb-6">
                Update Email
              </h2>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-300 block mb-2"
                  >
                    New Email Address
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
                  {isUpdating ? "Updating..." : "Update Email"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="card">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">
              Change Password
            </h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-semibold text-slate-300 block mb-2"
                >
                  Current Password
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
                  placeholder="Enter your current password"
                />
              </div>
              <div className="border-t border-slate-700 pt-5">
                <label
                  htmlFor="newPassword"
                  className="text-sm font-semibold text-slate-300 block mb-2"
                >
                  New Password
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
                  placeholder="Enter your new password (min 6 chars)"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-300 block mb-2"
                >
                  Confirm New Password
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
                  placeholder="Confirm your new password"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
              >
                {isUpdating ? "Updating..." : "Change Password"}
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
                  <h2 className="text-2xl font-bold text-cyan-300">API Keys</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Manage API keys for programmatic access to Easy Flags
                  </p>
                </div>
                {!showNewApiKeyForm && (
                  <button
                    onClick={() => setShowNewApiKeyForm(true)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition font-medium"
                  >
                    + Create New
                  </button>
                )}
              </div>

              {showNewApiKeyForm && (
                <div className="card mb-6">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4">
                    Create New API Key
                  </h3>
                  <form onSubmit={handleCreateApiKey} className="space-y-4">
                    <div className="p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
                      <p className="text-sm text-cyan-200">
                        🔑 A new API key will be generated for your account.
                        Keep it secure and never share it.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
                      >
                        {isUpdating ? "Creating..." : "Generate Key"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewApiKeyForm(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {apiKeys.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-slate-400 font-medium">No API keys yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Create your first API key to get started with programmatic
                  access
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
                          📅 Created:{" "}
                          {new Date(key.created_at).toLocaleDateString()}
                        </span>
                        {key.last_used && (
                          <span>
                            🕐 Last used:{" "}
                            {new Date(key.last_used).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="ml-4 px-3 py-1 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 rounded transition text-sm font-medium flex-shrink-0"
                    >
                      Delete
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
                    Preferences
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Manage your notification and security settings
                  </p>
                </div>
              </div>

              {preferences && (
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-700 transition">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-100 text-base">
                        📧 Email Notifications
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Receive email notifications for important account events
                        and feature flag changes
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
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
                        🔒 Security Alerts
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Get notified of unusual account activity and login
                        attempts
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
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

            {/* Coming Soon Features */}
            <div className="card opacity-60 pointer-events-none">
              <h3 className="font-semibold text-slate-400 mb-4">Coming Soon</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-sm">
                      🔐 Two-Factor Authentication
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    2FA
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-sm">
                      🌙 Dark Mode Toggle
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
      </div>
    </div>
  );
}
