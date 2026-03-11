import React, { useState } from "react";
import SpaceNavigation from "./SpaceNavigation";

interface Environment {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface EnvironmentsViewProps {
  spaceId: string | undefined;
}

const getEnvironmentColor = (name: string) => {
  switch (name.toLowerCase()) {
    case "production":
      return { bg: "from-red-900/20 to-red-900/10", border: "border-red-500/30", accent: "text-red-400", badge: "bg-red-500/20 text-red-300" };
    case "staging":
      return { bg: "from-yellow-900/20 to-yellow-900/10", border: "border-yellow-500/30", accent: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" };
    case "development":
      return { bg: "from-blue-900/20 to-blue-900/10", border: "border-blue-500/30", accent: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" };
    default:
      return { bg: "from-cyan-900/20 to-cyan-900/10", border: "border-cyan-500/30", accent: "text-cyan-400", badge: "bg-cyan-500/20 text-cyan-300" };
  }
};

export default function EnvironmentsView({ spaceId }: EnvironmentsViewProps) {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: 1,
      name: "Production",
      description: "Live environment - be careful here!",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Staging",
      description: "Pre-production testing environment",
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Development",
      description: "Local development environment",
      created_at: new Date().toISOString(),
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvDescription, setNewEnvDescription] = useState("");

  const handleCreateEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;

    const newEnv: Environment = {
      id: Math.max(...environments.map((e) => e.id), 0) + 1,
      name: newEnvName,
      description: newEnvDescription,
      created_at: new Date().toISOString(),
    };

    setEnvironments([...environments, newEnv]);
    setNewEnvName("");
    setNewEnvDescription("");
    setShowCreateModal(false);
  };

  const handleEditEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnv || !newEnvName.trim()) return;

    setEnvironments(
      environments.map((env) =>
        env.id === editingEnv.id
          ? { ...env, name: newEnvName, description: newEnvDescription }
          : env
      )
    );
    setEditingEnv(null);
    setNewEnvName("");
    setNewEnvDescription("");
    setShowEditModal(false);
  };

  const startEditingEnvironment = (env: Environment) => {
    setEditingEnv(env);
    setNewEnvName(env.name);
    setNewEnvDescription(env.description || "");
    setShowEditModal(true);
  };

  const deleteEnvironment = (id: number) => {
    if (confirm("Are you sure you want to delete this environment?")) {
      setEnvironments(environments.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <SpaceNavigation
        spaceId={spaceId}
        spaceName="Acme Corporation"
        currentTab="environments"
      />

      <div className="mt-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Environments</h2>
              <p className="text-slate-400">
                Manage deployment stages for your feature flags. Each environment has its own configuration.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingEnv(null);
                setNewEnvName("");
                setNewEnvDescription("");
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
            >
              + Create Environment
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm font-semibold mb-1">Production</p>
              <p className="text-slate-400 text-xs">Live environment with real users</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm font-semibold mb-1">Staging</p>
              <p className="text-slate-400 text-xs">Pre-production testing stage</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm font-semibold mb-1">Development</p>
              <p className="text-slate-400 text-xs">Local development environment</p>
            </div>
          </div>
        </div>

        {/* Environments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {environments.map((env) => {
            const colors = getEnvironmentColor(env.name);
            return (
              <div
                key={env.id}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-xl font-bold ${colors.accent}`}>
                        {env.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${colors.badge} font-semibold`}>
                        {env.name}
                      </span>
                    </div>
                    {env.description && (
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {env.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditingEnvironment(env)}
                      className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-700/50 rounded transition"
                      title="Edit environment"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteEnvironment(env.id)}
                      className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-900/20 rounded transition"
                      title="Delete environment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    Created {new Date(env.created_at).toLocaleDateString()}
                  </span>
                  <a href={`/spaces/${spaceId}/environments/${env.id}`} className={`text-sm font-semibold ${colors.accent} hover:brightness-110 transition`}>
                    View →
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {environments.length === 0 && (
          <div className="text-center py-12 card">
            <p className="text-slate-400 mb-4">No environments yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Create your first environment
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-cyan-700/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">
              {editingEnv ? "Edit Environment" : "Create Environment"}
            </h2>

            <form
              onSubmit={editingEnv ? handleEditEnvironment : handleCreateEnvironment}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Environment Name
                </label>
                <input
                  type="text"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="e.g., Production, Staging"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newEnvDescription}
                  onChange={(e) => setNewEnvDescription(e.target.value)}
                  placeholder="What is this environment for?"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none h-24 transition"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingEnv(null);
                    setNewEnvName("");
                    setNewEnvDescription("");
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-lg transition font-semibold"
                >
                  {editingEnv ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
