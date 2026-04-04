import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { Modal } from "@/components/react/shared/Modals";

interface FeatureEnvironmentConfig {
  environmentId: number;
  environmentName: string;
  enabled: boolean;
  rolloutPercentage?: number;
}

interface Feature {
  id: number;
  key: string;
  name: string;
  description?: string;
  type: "boolean" | "string" | "json";
  environments: FeatureEnvironmentConfig[];
  created_at: string;
}

interface Environment {
  id: number;
  name: string;
  type: string;
}

interface FeaturesViewProps {
  spaceId: string | undefined;
  spaceName?: string;
}

const getEnvironmentColor = (type: string) => {
  switch (type) {
    case "production":
      return "red";
    case "staging":
      return "yellow";
    case "development":
      return "blue";
    default:
      return "cyan";
  }
};

const getEnvironmentEmoji = (type: string) => {
  switch (type) {
    case "production":
      return "🔴";
    case "staging":
      return "🟡";
    case "development":
      return "🔵";
    default:
      return "⚪";
  }
};

const getEnvironmentDefaultDescription = (type: string) => {
  switch (type) {
    case "production":
      return "Live environment";
    case "staging":
      return "Pre-production testing";
    case "development":
      return "Local development";
    default:
      return "Custom environment";
  }
};

const typeColors: Record<string, { bg: string; text: string }> = {
  boolean: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400" },
  string: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-400" },
  json: { bg: "bg-green-500/10 border-green-500/20", text: "text-green-400" },
};

const getEnvironmentGradient = (color: string) => {
  switch (color) {
    case "red":
      return "from-red-500/10 via-red-500/5 to-transparent border-red-500/20";
    case "yellow":
      return "from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20";
    case "blue":
      return "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20";
    default:
      return "from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/20";
  }
};

export default function FeaturesView({ spaceId, spaceName }: FeaturesViewProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  
  // Form states
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [newFeatureType, setNewFeatureType] = useState<"boolean" | "string" | "json">("boolean");

  useEffect(() => {
    fetchInitialData();
  }, [spaceId]);

  const fetchInitialData = async () => {
    if (!spaceId) return;
    try {
      setIsLoading(true);
      await Promise.all([fetchEnvironments(), fetchFeatures()]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/environments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEnvironments(data);
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch environments:", error);
    }
    return [];
  };

  const fetchFeatures = async () => {
    if (!spaceId) return;
    try {
      const response = await fetch(`/api/spaces/${spaceId}/features`, {
        credentials: "include",
      });
      
      const envResponse = await fetch(`/api/spaces/${spaceId}/environments`, {
        credentials: "include",
      });
      const currentEnvs: Environment[] = envResponse.ok ? await envResponse.json() : [];
      
      if (response.ok) {
        const data = await response.json();
        const transformedFeatures = data.map((feature: any) => ({
          ...feature,
          environments: currentEnvs.map((env) => ({
            environmentId: env.id,
            environmentName: env.name,
            enabled: false,
          })),
        }));
        setFeatures(transformedFeatures);
      }
    } catch (error) {
      console.error("Failed to fetch features:", error);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureKey.trim() || !newFeatureName.trim() || !spaceId) return;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          key: newFeatureKey,
          name: newFeatureName,
          description: newFeatureDescription,
          type: newFeatureType,
          default_value: newFeatureType === "boolean" ? "false" : "",
        }),
      });

      if (response.ok) {
        resetForm();
        setShowCreateModal(false);
        await fetchFeatures();
      }
    } catch (error) {
      console.error("Failed to create feature:", error);
    }
  };

  const handleEditFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature || !newFeatureKey.trim() || !newFeatureName.trim()) return;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/features/${editingFeature.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newFeatureKey,
          name: newFeatureName,
          description: newFeatureDescription,
          type: newFeatureType,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowEditModal(false);
        await fetchFeatures();
      }
    } catch (error) {
      console.error("Failed to edit feature:", error);
    }
  };

  const resetForm = () => {
    setEditingFeature(null);
    setNewFeatureKey("");
    setNewFeatureName("");
    setNewFeatureDescription("");
    setNewFeatureType("boolean");
  };

  const startEditingFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setNewFeatureKey(feature.key);
    setNewFeatureName(feature.name);
    setNewFeatureDescription(feature.description || "");
    setNewFeatureType(feature.type);
    setShowEditModal(true);
  };

  const deleteFeature = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feature flag?") || !spaceId) return;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/features/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchFeatures();
      }
    } catch (error) {
      console.error("Failed to delete feature:", error);
    }
  };

  const toggleEnvironmentFlag = (featureId: number, environmentId: number) => {
    setFeatures(
      features.map((f) =>
        f.id === featureId
          ? {
              ...f,
              environments: f.environments.map((env) =>
                env.environmentId === environmentId
                  ? { ...env, enabled: !env.enabled }
                  : env,
              ),
            }
          : f,
      ),
    );
  };

  return (
    <PageContainer
      spaceId={spaceId}
      spaceName={spaceName}
      currentTab="features"
    >
      <div className="space-y-12">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="max-w-2xl">
            <h1 className="section-title mb-4">Feature Flags</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Create once, deploy everywhere. Configure your flags independently across environments with a single click.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary"
          >
            <span className="mr-2 text-xl">+</span>
            Create Flag
          </button>
        </section>

        {/* Environment Legend */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                {environments.map((env) => (
                  <div
                    key={env.id}
                    className={`bg-linear-to-br ${getEnvironmentGradient(getEnvironmentColor(env.type))} border rounded-2xl p-5 hover:bg-white/5 transition-all group`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{getEnvironmentEmoji(env.type)}</span>
                       <h3 className="text-sm font-bold text-white tracking-widest capitalize">{env.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {getEnvironmentDefaultDescription(env.type)}
                    </p>
                  </div>
                ))}
                {environments.length === 0 && (
                  <div className="col-span-full py-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-sm text-slate-500 italic">No environments configured yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Features List */}
        <section className="space-y-6 animate-in fade-in duration-700 delay-200">
          {isLoading ? (
             Array(2).fill(0).map((_, i) => (
               <div key={i} className="card h-64 animate-pulse bg-white/5"></div>
             ))
          ) : features.length === 0 ? (
            <div className="text-center py-24 card flex flex-col items-center justify-center border-dashed border-white/10">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🚩</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No feature flags found</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Start by creating your first feature flag to manage your application's behavior.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-secondary"
              >
                Create your first flag
              </button>
            </div>
          ) : (
            features.map((feature) => (
              <div
                key={feature.id}
                className="card group"
              >
                {/* Feature Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                        {feature.name}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${typeColors[feature.type].bg} ${typeColors[feature.type].text}`}>
                        {feature.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <code className="bg-slate-950/50 text-cyan-400 px-3 py-1.5 rounded-lg font-mono text-xs border border-white/5 shadow-inner">
                        {feature.key}
                      </code>
                    </div>
                    {feature.description && (
                      <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                        {feature.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEditingFeature(feature)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Edit feature flag"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button
                      onClick={() => deleteFeature(feature.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete feature flag"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                </div>

                {/* Environment Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-8 border-t border-white/5">
                  {feature.environments.map((envConfig) => {
                    const env = environments.find((e) => e.id === envConfig.environmentId);
                    if (!env) return null;

                    return (
                      <div
                        key={envConfig.environmentId}
                        className={`bg-linear-to-br ${getEnvironmentGradient(getEnvironmentColor(env.type))} border rounded-2xl p-5 flex items-center justify-between group/toggle`}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-bold text-white text-xs tracking-wider mb-1 truncate capitalize">
                            {env.name}
                          </p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${envConfig.enabled ? "text-green-400" : "text-slate-500"}`}>
                            {envConfig.enabled ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleEnvironmentFlag(feature.id, envConfig.environmentId)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                            envConfig.enabled ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 ease-in-out ${
                              envConfig.enabled ? "translate-x-6" : "translate-x-1"
                            } shadow-sm`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Created {new Date(feature.created_at).toLocaleDateString()}
                  </div>
                  <a
                    href={`/spaces/${spaceId}/features/${feature.id}`}
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest group/link transition-all"
                  >
                    Advanced Config
                    <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Feature Modal */}
      <Modal
        id="feature-modal"
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={editingFeature ? "Edit Feature Flag" : "New Feature Flag"}
      >
        <form onSubmit={editingFeature ? handleEditFeature : handleCreateFeature} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Feature Key
            </label>
            <input
              type="text"
              value={newFeatureKey}
              onChange={(e) => setNewFeatureKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder="e.g., NEW_DASHBOARD"
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-mono text-sm"
              required
              disabled={!!editingFeature}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Display Name
            </label>
            <input
              type="text"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              placeholder="e.g., New Dashboard"
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Description
            </label>
            <textarea
              value={newFeatureDescription}
              onChange={(e) => setNewFeatureDescription(e.target.value)}
              placeholder="What does this feature flag do?"
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all h-24 resize-none text-sm leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              Flag Type
            </label>
            <select
              value={newFeatureType}
              onChange={(e) => setNewFeatureType(e.target.value as any)}
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="boolean">Boolean (on/off)</option>
              <option value="string">String (text)</option>
              <option value="json">JSON (complex)</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="flex-1 py-3 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-3! shadow-lg shadow-cyan-500/20"
            >
              {editingFeature ? "Save Changes" : "Create Flag"}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="w-16 h-4 bg-white/10 rounded mb-4"></div>
      <div className="w-full h-8 bg-white/5 rounded"></div>
    </div>
  );
}
