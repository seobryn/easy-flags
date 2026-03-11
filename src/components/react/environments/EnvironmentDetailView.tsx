import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";

interface EnvironmentDetailViewProps {
  spaceId: string | undefined;
  envId: string | undefined;
  envName: string;
  envDescription?: string;
  apiKey: string;
  createdAt?: string;
}

export default function EnvironmentDetailView({
  spaceId,
  envId,
  envName,
  envDescription,
  apiKey,
  createdAt,
}: EnvironmentDetailViewProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [spaceName, setSpaceName] = useState("Space");
  const [currentApiKey, setCurrentApiKey] = useState(apiKey);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchEnvironmentData();
  }, [envId, spaceId]);

  const fetchEnvironmentData = async () => {
    if (!envId || !spaceId) return;

    try {
      setIsLoading(true);
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

  const handleRegenerateKey = async () => {
    if (!envId || !spaceId) return;

    try {
      setIsRegenerating(true);
      const response = await fetch(
        `/api/spaces/${spaceId}/environments/${envId}/regenerate-key`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (response.ok) {
        const updatedEnv = await response.json();
        setCurrentApiKey(updatedEnv.api_key);
      } else {
        console.error("Failed to regenerate API key");
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(currentApiKey).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

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
                  {currentApiKey ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="password"
                        value={currentApiKey}
                        readOnly
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                      />
                      <button
                        onClick={() => setShowApiKeyModal(true)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
                      >
                        Reveal
                      </button>
                      <button
                        onClick={handleRegenerateKey}
                        disabled={isRegenerating}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-700 text-white rounded text-sm font-semibold transition"
                      >
                        {isRegenerating ? "Regenerating..." : "Regenerate"}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <button
                        onClick={handleRegenerateKey}
                        disabled={isRegenerating}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-700 text-white rounded text-sm font-semibold transition"
                      >
                        {isRegenerating ? "Generating..." : "Generate API Key"}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
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

            {/* Deployed Features */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🚀</span>
                <h2 className="text-xl font-bold text-white">
                  Deployed Features
                </h2>
              </div>

              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">
                  Features will be displayed here once deployed to this
                  environment
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  <p className="text-slate-300">
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
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
              <div className="relative">
                <div className="p-4 bg-slate-900 border border-slate-700 rounded font-mono text-sm break-all pr-12">
                  <p className="text-cyan-400">{currentApiKey}</p>
                </div>
                <button
                  onClick={handleCopyApiKey}
                  className="absolute top-1/2 -translate-y-1/2 right-2 p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition"
                  title="Copy to clipboard"
                >
                  {isCopied ? "✓" : "📋"}
                </button>
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
