import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { Modal } from "@/components/react/shared/Modals";
import { Icon, type IconName } from "@/components/react/shared/Icon";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

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
  initialLocale?: AvailableLanguages;
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
  string: {
    bg: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-400",
  },
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

export default function FeaturesView({
  spaceId,
  spaceName,
  initialLocale,
}: FeaturesViewProps) {
  const t = useTranslate(initialLocale);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);

  // Form states
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [newFeatureType, setNewFeatureType] = useState<
    "boolean" | "string" | "json"
  >("boolean");
  const [limits, setLimits] = useState<{
    max_flags: number | null;
    max_environments: number | null;
  } | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, [spaceId]);

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const fetchInitialData = async () => {
    if (!spaceId) return;
    try {
      setIsLoading(true);
      await Promise.all([fetchEnvironments(), fetchFeatures(), fetchLimits()]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/limits`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLimits(data.limits);
      }
    } catch (error) {
      console.error("Failed to fetch limits:", error);
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
      const currentEnvs: Environment[] = envResponse.ok
        ? await envResponse.json()
        : [];

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

        // Update limit status
        if (limits && limits.max_flags !== null && limits.max_flags !== -1) {
          setIsLimitReached(transformedFeatures.length >= limits.max_flags);
        }
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
    if (!editingFeature || !newFeatureKey.trim() || !newFeatureName.trim())
      return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/features/${editingFeature.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: newFeatureKey,
            name: newFeatureName,
            description: newFeatureDescription,
            type: newFeatureType,
          }),
        },
      );

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

  const deleteFeature = async () => {
    if (!featureToDelete || !spaceId) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/features/${featureToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setShowDeleteModal(false);
        setFeatureToDelete(null);
        await fetchFeatures();
      }
    } catch (error) {
      console.error("Failed to delete feature:", error);
    }
  };

  const confirmDeleteFeature = (feature: Feature) => {
    setFeatureToDelete(feature);
    setShowDeleteModal(true);
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
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 transition-all hover:bg-white/[0.04] hover:border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-cyan-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Control Center
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                {t("navigation.flags")}
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                Manage your application's behavior in real-time. Toggle features
                instantly across all environments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64 group/search">
                <Icon
                  name="Search"
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-cyan-400 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] transition-all"
                />
              </div>

              <button
                onClick={() => {
                  if (isLimitReached) return;
                  resetForm();
                  setShowCreateModal(true);
                }}
                disabled={isLimitReached}
                className={`w-full sm:w-auto btn-primary flex items-center justify-center gap-3 px-8 py-3.5 shadow-2xl shadow-cyan-500/25 ${isLimitReached ? "opacity-50 cursor-not-allowed grayscale" : "hover:scale-105 active:scale-95 transition-all"}`}
              >
                <Icon
                  name={isLimitReached ? "Lock" : "Plus"}
                  size={18}
                  className={!isLimitReached ? "animate-bounce-subtle" : ""}
                />
                <span className="font-bold text-sm tracking-tight">
                  {isLimitReached ? "Limit Reached" : "Create Flag"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Environment Quick Legend */}
        {!isLoading && environments.length > 0 && (
          <div className="flex flex-wrap gap-4 px-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
            {environments.map((env) => (
              <div
                key={env.id}
                className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-all group"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">
                  {getEnvironmentEmoji(env.type)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors capitalize">
                  {env.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Features Table View */}
        <div className="relative group">
          {/* Subtle background glow */}
          <div className="absolute -inset-4 bg-cyan-500/5 blur-3xl rounded-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-16 w-full bg-white/[0.03] animate-pulse rounded-2xl"
                    ></div>
                  ))}
              </div>
            ) : filteredFeatures.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-cyan-500/5 rounded-full flex items-center justify-center mb-6 group/empty">
                  <Icon
                    name="Flag"
                    size={40}
                    className="text-cyan-500/40 group-hover:scale-110 group-hover:text-cyan-400 transition-all duration-500"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No flags found
                </h3>
                <p className="text-slate-500 text-sm max-w-xs transition-colors group-hover:text-slate-400">
                  {searchTerm
                    ? `No flags match your search "${searchTerm}"`
                    : "Ready to start toggling? Create your first feature flag to begin."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-6 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Flag
                      </th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden xl:table-cell">
                        Key
                      </th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Type
                      </th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Environments
                      </th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filteredFeatures.map((feature) => (
                      <tr
                        key={feature.id}
                        className="group/row hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm mb-1 group-hover/row:text-cyan-400 transition-colors">
                              {feature.name}
                            </span>
                            <span className="text-slate-500 text-[11px] font-medium xl:hidden">
                              {feature.key}
                            </span>
                            {feature.description && (
                              <p className="text-slate-500 text-xs mt-2 line-clamp-1 max-w-xs font-medium">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6 hidden xl:table-cell">
                          <code className="text-cyan-500/70 bg-cyan-500/5 px-3 py-1.5 rounded-lg text-[10px] font-mono border border-cyan-500/10 tracking-tight">
                            {feature.key}
                          </code>
                        </td>
                        <td className="px-6 py-6">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${typeColors[feature.type].bg} ${typeColors[feature.type].text}`}
                          >
                            <Icon
                              name={
                                (
                                  {
                                    boolean: "Zap",
                                    string: "Type",
                                    json: "Code",
                                  } as const
                                )[feature.type]
                              }
                              size={10}
                            />
                            {feature.type}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            {feature.environments.map((envConfig) => {
                              const env = environments.find(
                                (e) => e.id === envConfig.environmentId,
                              );
                              if (!env) return null;

                              return (
                                <button
                                  key={env.id}
                                  onClick={() =>
                                    toggleEnvironmentFlag(feature.id, env.id)
                                  }
                                  className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 group/env overflow-hidden border ${
                                    envConfig.enabled
                                      ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                      : "bg-white/[0.03] border-white/5 text-slate-600 hover:bg-white/[0.08] hover:border-white/10"
                                  }`}
                                  title={`${env.name}: ${envConfig.enabled ? "Enabled" : "Disabled"}`}
                                >
                                  <span className="text-xs relative z-10 transition-transform group-active/env:scale-90">
                                    {getEnvironmentEmoji(env.type)}
                                  </span>
                                  {envConfig.enabled && (
                                    <span className="absolute inset-0 bg-cyan-400/10 animate-pulse"></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all transform translate-x-2 group-hover/row:translate-x-0">
                            <a
                              href={`/spaces/${spaceId}/features/${feature.id}`}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 transition-all shadow-inner"
                              title="Advanced Configuration"
                            >
                              <Icon name="Settings" size={16} />
                            </a>
                            <button
                              onClick={() => startEditingFeature(feature)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all shadow-inner"
                              title="Edit Details"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => confirmDeleteFeature(feature)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition-all shadow-inner"
                              title="Delete Flag"
                            >
                              <Icon name="Trash" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
        <form
          onSubmit={editingFeature ? handleEditFeature : handleCreateFeature}
          className="space-y-8 py-2 font-sans"
        >
          <div className="space-y-6">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-1">
                Feature Key
              </label>
              <input
                type="text"
                value={newFeatureKey}
                onChange={(e) =>
                  setNewFeatureKey(
                    e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  )
                }
                placeholder="e.g., NEW_DASHBOARD"
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-xs shadow-inner"
                required
                disabled={!!editingFeature}
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-1">
                Display Name
              </label>
              <input
                type="text"
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                placeholder="e.g., New Dashboard"
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-xs shadow-inner"
                required
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-1">
                Description
              </label>
              <textarea
                value={newFeatureDescription}
                onChange={(e) => setNewFeatureDescription(e.target.value)}
                placeholder="What does this feature flag do?"
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all h-24 resize-none text-xs font-medium leading-relaxed shadow-inner"
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 px-1">
                Flag Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["boolean", "string", "json"] as const).map((type) => {
                  const isActive = newFeatureType === type;
                  const icons = {
                    boolean: "Zap",
                    string: "Type",
                    json: "Code",
                  } as const;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewFeatureType(type)}
                      className={`group/type flex flex-col items-center justify-center gap-2 py-3 rounded-2xl font-black transition-all border ${
                        isActive
                          ? "text-cyan-400 border-cyan-500/30 bg-white/[0.03] shadow-xl shadow-white/5 ring-1 ring-white/5"
                          : "bg-slate-950/40 border-transparent text-slate-600 hover:text-slate-400 hover:bg-white/[0.01]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-white/5 shadow-inner"
                            : "bg-white/[0.02]"
                        }`}
                      >
                        <Icon
                          name={icons[type] as IconName}
                          size={16}
                          className={
                            isActive
                              ? "text-cyan-400"
                              : "text-slate-700 group-hover/type:text-slate-500"
                          }
                        />
                      </div>
                      <span className="text-[8px] uppercase tracking-[0.1em] font-black">
                        {type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 mt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="flex-1 py-4 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white transition-colors border border-transparent hover:bg-white/5 rounded-2xl"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="flex-[1.5] py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-slate-950 bg-linear-to-r from-cyan-400 to-blue-500 shadow-2xl shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {editingFeature ? t("common.save") : "Create Flag"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        id="delete-feature-modal"
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFeatureToDelete(null);
        }}
        title="Delete Feature Flag"
      >
        <div className="space-y-8 py-4 font-sans text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="AlertTriangle" size={40} className="text-red-500" />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Are you sure?</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              You are about to permanently delete the flag{" "}
              <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">
                {featureToDelete?.key}
              </span>
              . This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-4 pt-6 mt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setFeatureToDelete(null);
              }}
              className="flex-1 py-4 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white transition-colors border border-transparent hover:bg-white/5 rounded-2xl"
            >
              Cancel
            </button>
            <button
              onClick={deleteFeature}
              className="flex-[1.5] py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-white bg-red-500 hover:bg-red-600 shadow-2xl shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Delete Permanently
            </button>
          </div>
        </div>
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
