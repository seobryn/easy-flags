import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";

interface EnvironmentDetailViewProps {
  spaceId: string | undefined;
  envId: string | undefined;
  envName: string;
  envDescription?: string;
}

interface EnvironmentConfig {
  id: string;
  key: string;
  defaultValue: string;
  overriddenValue?: string;
}

export default function EnvironmentDetailView({
  spaceId,
  envId,
  envName,
  envDescription,
}: EnvironmentDetailViewProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [configs, setConfigs] = useState<EnvironmentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spaceName, setSpaceName] = useState("Space");

  useEffect(() => {
    fetchEnvironmentData();
  }, [envId, spaceId]);

  const fetchEnvironmentData = async () => {
    if (!envId || !spaceId) return;

    try {
      setIsLoading(true);
      // Fetch environment configs
      const configResponse = await fetch(`/api/environments/${envId}/configs`, {
        credentials: "include",
      });
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfigs(configData);
      }

      // Fetch space data to get space name
      const spaceResponse = await fetch(`/api/spaces/${spaceId}`, {
        credentials: "include",
      });
      if (spaceResponse.ok) {
        const spaceData = await spaceResponse.json();
        setSpaceName(spaceData.name || "Space");
      }
    } catch (error) {
      console.error("Failed to fetch environment data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnvironmentColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "production":
        return {
          bg: "from-red-900/20 to-red-900/10",
          border: "border-red-500/30",
          accent: "text-red-400",
          badge: "bg-red-500/20 text-red-300",
        };
      case "staging":
        return {
          bg: "from-yellow-900/20 to-yellow-900/10",
          border: "border-yellow-500/30",
          accent: "text-yellow-400",
          badge: "bg-yellow-500/20 text-yellow-300",
        };
      case "development":
        return {
          bg: "from-blue-900/20 to-blue-900/10",
          border: "border-blue-500/30",
          accent: "text-blue-400",
          badge: "bg-blue-500/20 text-blue-300",
        };
      default:
        return {
          bg: "from-cyan-900/20 to-cyan-900/10",
          border: "border-cyan-500/30",
          accent: "text-cyan-400",
          badge: "bg-cyan-500/20 text-cyan-300",
        };
    }
  };

  const colors = getEnvironmentColor(envName);
  const apiKey = `env_${envId}_${Math.random().toString(36).substring(2, 15)}`;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-cyan-400 animate-pulse">
            Loading environment...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageContainer
        spaceId={spaceId}
        spaceName={spaceName}
        currentTab="environments"
        subPage={{ name: envName, path: `/spaces/${spaceId}/environments` }}
      >
        {/* Header Section */}
        <div className="mb-12 mt-12">
          <div className="flex flex-col mb-6">
            <p className="text-slate-400">
              {envDescription ||
                "Configure and manage this environment's settings, API keys, and deployments."}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* API Configuration */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🔑</span>
                <h2 className="text-xl font-bold text-white">
                  API Configuration
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Environment Name
                  </label>
                  <input
                    type="text"
                    value={envName}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      readOnly
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    />
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
                    >
                      Reveal
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Use this key to authenticate requests to this environment
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="text"
                    value={`https://api.easyflags.io/environments/${envId}/webhooks`}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-xl font-bold text-white">Configuration</h2>
              </div>

              <div className="space-y-3">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="p-4 bg-slate-900/50 border border-slate-700 rounded hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {config.key}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Default:{" "}
                          <span className="text-slate-300">
                            {config.defaultValue}
                          </span>
                        </p>
                      </div>
                      <button
                        className="text-slate-500 hover:text-slate-300 p-1"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    </div>
                    {config.overriddenValue && (
                      <div className="pl-3 border-l-2 border-cyan-500">
                        <p className="text-xs text-cyan-400">
                          Overridden:{" "}
                          <span className="text-cyan-300 font-semibold">
                            {config.overriddenValue}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition">
                + Add Configuration
              </button>
            </div>

            {/* Deployed Features */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🚀</span>
                <h2 className="text-xl font-bold text-white">
                  Deployed Features
                </h2>
              </div>

              <div className="space-y-2">
                {["New Dashboard", "Dark Mode", "Beta Analytics"].map(
                  (feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded hover:border-slate-600 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">✓</span>
                        <span className="text-white">{feature}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                        Active
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📊</span>
                <h3 className="text-lg font-bold text-white">Status</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Health</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-green-400 font-semibold">
                      Healthy
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-slate-300 font-semibold">99.98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-slate-300 font-semibold">45ms</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📈</span>
                <h3 className="text-lg font-bold text-white">Analytics</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-2">Requests Today</p>
                  <p className="text-2xl font-bold text-cyan-400">45.2K</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-2">Error Rate</p>
                  <p className="text-2xl font-bold text-green-400">0.02%</p>
                </div>
              </div>
            </div>

            {/* Environment Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">ℹ️</span>
                <h3 className="text-lg font-bold text-white">Info</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-400">
                <div>
                  <p className="text-slate-500 font-semibold mb-1">
                    Environment ID
                  </p>
                  <p className="text-slate-300 font-mono break-all">{envId}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold mb-1">Created</p>
                  <p className="text-slate-300">March 10, 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* API Key Reveal Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full mx-4 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-slate-800 px-6 py-8 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">API Key</h2>
              <p className="text-sm text-slate-400 mt-2">
                Keep this secret and safe
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-700 rounded font-mono text-sm break-all">
                <p className="text-cyan-400">{apiKey}</p>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300">
                <p className="font-semibold mb-1">⚠️ Security Warning</p>
                <p className="text-xs">
                  Never share this key publicly or commit it to version control.
                </p>
              </div>

              <button
                onClick={() => setShowApiKeyModal(false)}
                className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
