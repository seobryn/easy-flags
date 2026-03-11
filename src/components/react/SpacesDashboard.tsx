import React, { useEffect, useState } from "react";

interface Space {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  members_count?: number;
  created_at: string;
}

export default function SpacesDashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await fetch("/api/spaces");
      if (response.ok) {
        const data = await response.json();
        setSpaces(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName,
          description: newSpaceDescription,
        }),
      });

      if (response.ok) {
        setNewSpaceName("");
        setNewSpaceDescription("");
        setShowCreateModal(false);
        await fetchSpaces();
      }
    } catch (error) {
      console.error("Failed to create space:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-cyan-400">Loading spaces...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Spaces</h1>
          <p className="text-slate-400">
            Spaces represent your organizations or projects. Each space contains
            features, and features exist in environments (Production, Staging,
            Development, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary whitespace-nowrap"
        >
          + Create Space
        </button>
      </div>

      {/* Hierarchy visualization */}
      <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-4">
        <p className="text-sm text-slate-400 mb-3">
          <span className="text-cyan-300 font-semibold">Hierarchy:</span>
        </p>
        <div className="text-sm text-slate-300 font-mono ml-4 space-y-1">
          <div>📦 Space: "Acme Corp"</div>
          <div className="ml-4">├─ 🌍 Environment: Production</div>
          <div className="ml-4">├─ 🌍 Environment: Staging</div>
          <div className="ml-4">├─ 🌍 Environment: Development</div>
          <div className="ml-4">└─ ⚙️ Features (configured per environment)</div>
        </div>
      </div>

      {spaces.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-cyan-300 mb-2">
            No spaces yet
          </h2>
          <p className="text-slate-400 mb-4">
            A space represents your organization or project. Create your first
            space to get started with feature flags.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Example: "Acme Corp", "Mobile App", "E-commerce Platform", etc.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-block"
          >
            Create First Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <a
              key={space.id}
              href={`/spaces/${space.id}`}
              className="card group hover:shadow-2xl"
            >
              <h3 className="text-xl font-bold text-cyan-300 group-hover:text-cyan-200 transition mb-2">
                {space.name}
              </h3>
              {space.description && (
                <p className="text-slate-400 text-sm mb-4">
                  {space.description}
                </p>
              )}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
                <div className="text-sm text-slate-500">
                  Created {new Date(space.created_at).toLocaleDateString()}
                </div>
                {space.members_count && (
                  <div className="text-sm text-slate-500">
                    {space.members_count} members
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-cyan-700/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-cyan-300">Create Space</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Space Name
                </label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., Production"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none h-20"
                  placeholder="Describe this space..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
