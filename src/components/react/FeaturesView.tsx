import React, { useEffect, useState } from "react";
import SpaceNavigation from "./SpaceNavigation";

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

interface FeaturesViewProps {
  spaceId: string | undefined;
}

const ENVIRONMENTS = [
  { id: 1, name: "Production", color: "red" },
  { id: 2, name: "Staging", color: "yellow" },
  { id: 3, name: "Development", color: "blue" },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  boolean: { bg: "bg-blue-500/20", text: "text-blue-300" },
  string: { bg: "bg-purple-500/20", text: "text-purple-300" },
  json: { bg: "bg-green-500/20", text: "text-green-300" },
};

const getEnvironmentGradient = (color: string) => {
  switch (color) {
    case "red":
      return "from-red-900/20 to-red-900/10 border-red-500/30";
    case "yellow":
      return "from-yellow-900/20 to-yellow-900/10 border-yellow-500/30";
    case "blue":
      return "from-blue-900/20 to-blue-900/10 border-blue-500/30";
    default:
      return "from-cyan-900/20 to-cyan-900/10 border-cyan-500/30";
  }
};

export default function FeaturesView({ spaceId }: FeaturesViewProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [newFeatureType, setNewFeatureType] = useState<
    "boolean" | "string" | "json"
  >("boolean");

  useEffect(() => {
    fetchFeatures();
  }, [spaceId]);

  const fetchFeatures = async () => {
    if (!spaceId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/spaces/${spaceId}/features`);
      if (response.ok) {
        const data = await response.json();
        // Transform the features to include environment configurations
        const transformedFeatures = data.map((feature: any) => ({
          ...feature,
          environments: ENVIRONMENTS.map((env) => ({
            environmentId: env.id,
            environmentName: env.name,
            enabled: false, // This would need to be fetched from FeatureFlags
          })),
        }));
        setFeatures(transformedFeatures);
      } else {
        setFeatures([]);
      }
    } catch (error) {
      console.error("Failed to fetch features:", error);
      setFeatures([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureKey.trim() || !newFeatureName.trim() || !spaceId) return;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newFeatureKey,
          name: newFeatureName,
          description: newFeatureDescription,
          type: newFeatureType,
          default_value: newFeatureType === "boolean" ? "false" : "",
        }),
      });

      if (response.ok) {
        setNewFeatureKey("");
        setNewFeatureName("");
        setNewFeatureDescription("");
        setNewFeatureType("boolean");
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
        setEditingFeature(null);
        setNewFeatureKey("");
        setNewFeatureName("");
        setNewFeatureDescription("");
        setNewFeatureType("boolean");
        setShowEditModal(false);
        await fetchFeatures();
      }
    } catch (error) {
      console.error("Failed to edit feature:", error);
    }
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
    if (
      !confirm("Are you sure you want to delete this feature flag?") ||
      !spaceId
    )
      return;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/features/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFeatures();
      }
    } catch (error) {
      console.error("Failed to delete feature:", error);
    }
  };

  const toggleEnvironmentFlag = (featureId: number, environmentId: number) => {
    // TODO: Implement API call to update FeatureFlag state
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
    <div className="max-w-7xl mx-auto py-12 px-4">
      <SpaceNavigation
        spaceId={spaceId}
        spaceName="Acme Corporation"
        currentTab="features"
      />

      <div className="mt-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Feature Flags
              </h2>
              <p className="text-slate-400">
                Create feature flags once, and configure them differently for
                each environment. All flags are automatically available across
                all environments.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingFeature(null);
                setNewFeatureKey("");
                setNewFeatureName("");
                setNewFeatureDescription("");
                setNewFeatureType("boolean");
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 whitespace-nowrap"
            >
              + Create Feature Flag
            </button>
          </div>

          {/* Environment Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {ENVIRONMENTS.map((env) => (
              <div
                key={env.id}
                className={`bg-gradient-to-br ${getEnvironmentGradient(env.color)} border rounded-lg p-4`}
              >
                <p className="text-sm font-semibold mb-1">
                  {env.name === "Production" && "🔴"}
                  {env.name === "Staging" && "🟡"}
                  {env.name === "Development" && "🔵"} {env.name}
                </p>
                <p className="text-xs text-slate-400">
                  {env.name === "Production" && "Live environment"}
                  {env.name === "Staging" && "Pre-production testing"}
                  {env.name === "Development" && "Local development"}
                </p>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-8">
            <p className="text-sm text-cyan-300">
              💡 <span className="font-semibold">How it works:</span> When you
              create a feature flag, it's automatically available in all
              environments. Use the toggles below to enable/disable each flag
              per environment.
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-6">
          {features.length === 0 ? (
            <div className="text-center py-12 card">
              <p className="text-slate-400 mb-4 text-lg">
                No feature flags yet
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Create your first feature flag
              </button>
            </div>
          ) : (
            features.map((feature) => (
              <div
                key={feature.id}
                className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-xl p-8 hover:border-slate-600/50 transition-all duration-300"
              >
                {/* Feature Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {feature.name}
                      </h3>
                      <span
                        className={`${typeColors[feature.type].bg} ${typeColors[feature.type].text} text-xs px-3 py-1 rounded-full font-semibold`}
                      >
                        {feature.type}
                      </span>
                    </div>
                    <code className="text-cyan-400 font-mono text-sm block mb-2">
                      {feature.key}
                    </code>
                    {feature.description && (
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditingFeature(feature)}
                      className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-700/50 rounded transition"
                      title="Edit feature flag"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteFeature(feature.id)}
                      className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-900/20 rounded transition"
                      title="Delete feature flag"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Environment Configuration */}
                <div className="border-t border-slate-700/50 pt-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                    Environment Configuration
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {feature.environments.map((envConfig) => {
                      const env = ENVIRONMENTS.find(
                        (e) => e.id === envConfig.environmentId,
                      );
                      if (!env) return null;

                      return (
                        <div
                          key={envConfig.environmentId}
                          className={`bg-gradient-to-br ${getEnvironmentGradient(env.color)} border rounded-lg p-4 flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-white text-sm">
                                {env.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {envConfig.enabled ? "Enabled" : "Disabled"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              toggleEnvironmentFlag(
                                feature.id,
                                envConfig.environmentId,
                              )
                            }
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                              envConfig.enabled
                                ? "bg-green-600"
                                : "bg-slate-600"
                            }`}
                            title={`Toggle ${feature.name} in ${env.name}`}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                envConfig.enabled
                                  ? "translate-x-7"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    Created {new Date(feature.created_at).toLocaleDateString()}
                  </span>
                  <a
                    href={`/spaces/${spaceId}/features/${feature.id}`}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition"
                  >
                    Advanced Configuration →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-cyan-700/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">
              {editingFeature ? "Edit Feature Flag" : "Create Feature Flag"}
            </h2>

            <p className="text-sm text-slate-400 mb-6">
              {editingFeature
                ? "Update this feature flag definition. It will be available across all environments."
                : "Create a new feature flag. It will automatically be available in all environments."}
            </p>

            <form
              onSubmit={
                editingFeature ? handleEditFeature : handleCreateFeature
              }
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Feature Key *
                </label>
                <input
                  type="text"
                  value={newFeatureKey}
                  onChange={(e) =>
                    setNewFeatureKey(e.target.value.toLowerCase())
                  }
                  placeholder="e.g., new_dashboard"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm transition"
                  required
                  disabled={editingFeature ? true : false}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Lowercase, kebab-case. Used in your code.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  placeholder="e.g., New Dashboard"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newFeatureDescription}
                  onChange={(e) => setNewFeatureDescription(e.target.value)}
                  placeholder="What does this feature do?"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none h-20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={newFeatureType}
                  onChange={(e) =>
                    setNewFeatureType(
                      e.target.value as "boolean" | "string" | "json",
                    )
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                >
                  <option value="boolean">Boolean (on/off toggle)</option>
                  <option value="string">String (text value)</option>
                  <option value="json">JSON (complex object)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the data type for this flag's value
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingFeature(null);
                    setNewFeatureKey("");
                    setNewFeatureName("");
                    setNewFeatureDescription("");
                    setNewFeatureType("boolean");
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-lg transition font-semibold"
                >
                  {editingFeature ? "Save Changes" : "Create Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
