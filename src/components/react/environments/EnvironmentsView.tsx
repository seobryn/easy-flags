import { useState, useEffect } from "react";
import SpaceNavigation from "@/components/react/shared/SpaceNavigation";
import { Modal } from "@/components/react/shared/Modals";

type EnvironmentType = "production" | "staging" | "development" | "other";

interface Environment {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: EnvironmentType;
  created_at: string;
}

interface EnvironmentsViewProps {
  spaceId: string | undefined;
  spaceName?: string;
}

const ENVIRONMENT_TYPES: EnvironmentType[] = [
  "production",
  "staging",
  "development",
  "other",
];

const Icons = {
  Production: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Staging: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m16 12-4-4-4 4" />
      <path d="M12 16V8" />
    </svg>
  ),
  Development: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </svg>
  ),
  Other: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  Edit: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  Delete: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
};

const getEnvironmentColor = (type: EnvironmentType) => {
  switch (type) {
    case "production":
      return {
        bg: "from-rose-500/10 to-rose-600/5",
        border: "border-rose-500/20",
        accent: "text-rose-400",
        badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        icon: <Icons.Production />,
        glow: "bg-rose-500/10",
      };
    case "staging":
      return {
        bg: "from-amber-500/10 to-amber-600/5",
        border: "border-amber-500/20",
        accent: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        icon: <Icons.Staging />,
        glow: "bg-amber-500/10",
      };
    case "development":
      return {
        bg: "from-blue-500/10 to-blue-600/5",
        border: "border-blue-500/20",
        accent: "text-blue-400",
        badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        icon: <Icons.Development />,
        glow: "bg-blue-500/10",
      };
    case "other":
    default:
      return {
        bg: "from-cyan-500/10 to-cyan-600/5",
        border: "border-cyan-500/20",
        accent: "text-cyan-400",
        badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        icon: <Icons.Other />,
        glow: "bg-cyan-500/10",
      };
  }
};

export default function EnvironmentsView({
  spaceId,
  spaceName,
}: EnvironmentsViewProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [envToDelete, setEnvToDelete] = useState<Environment | null>(null);

  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvDescription, setNewEnvDescription] = useState("");
  const [newEnvType, setNewEnvType] = useState<EnvironmentType>("other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEnvironments();
  }, [spaceId]);

  const fetchEnvironments = async () => {
    if (!spaceId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/spaces/${spaceId}/environments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const envs = (Array.isArray(data) ? data : []).map((env: any) => ({
          ...env,
          type: env.type || "other",
        }));
        setEnvironments(envs);
      } else {
        setError("Failed to fetch environments");
      }
    } catch (err) {
      console.error("Error fetching environments:", err);
      setError("An error occurred while fetching environments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim() || !spaceId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/spaces/${spaceId}/environments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newEnvName,
          description: newEnvDescription || null,
          type: newEnvType,
        }),
      });

      if (response.ok) {
        const newEnv = await response.json();
        setEnvironments([...environments, newEnv]);
        resetForms();
      } else {
        setError("Failed to create environment");
      }
    } catch (err) {
      console.error("Error creating environment:", err);
      setError("An error occurred while creating the environment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnv || !newEnvName.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/spaces/${spaceId}/environments/${editingEnv.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: newEnvName,
            description: newEnvDescription || null,
            type: newEnvType,
          }),
        },
      );

      if (response.ok) {
        const updatedEnv = await response.json();
        setEnvironments(
          environments.map((env) =>
            env.id === editingEnv.id ? updatedEnv : env,
          ),
        );
        resetForms();
      } else {
        setError("Failed to update environment");
      }
    } catch (err) {
      console.error("Error updating environment:", err);
      setError("An error occurred while updating the environment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    setEditingEnv(null);
    setEnvToDelete(null);
    setNewEnvName("");
    setNewEnvDescription("");
    setNewEnvType("other");
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
  };

  const startEditingEnvironment = (env: Environment) => {
    setEditingEnv(env);
    setNewEnvName(env.name);
    setNewEnvDescription(env.description || "");
    setNewEnvType(env.type);
    setShowEditModal(true);
  };

  const handleDeleteEnvironment = async () => {
    if (!envToDelete || !spaceId) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/spaces/${spaceId}/environments/${envToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setEnvironments(environments.filter((e) => e.id !== envToDelete.id));
        resetForms();
      } else {
        setError("Failed to delete environment");
      }
    } catch (err) {
      console.error("Error deleting environment:", err);
      setError("An error occurred while deleting the environment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <SpaceNavigation
        spaceId={spaceId}
        spaceName={spaceName}
        currentTab="environments"
      />

      <div className="mt-16">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Icons.Delete />
            </div>
            <div>
              <p className="text-rose-400 font-bold text-sm">Critical Error</p>
              <p className="text-rose-500/80 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                Manage your <span className="text-gradient">Environments</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Control deployment stages. Flags exist in all environments but
                can have different values independently.
              </p>
            </div>
            <button
              onClick={() => {
                resetForms();
                setShowCreateModal(true);
              }}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 px-8! py-4! shadow-xl shadow-cyan-500/20"
            >
              <Icons.Other />
              New Environment
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TypePill
              type="production"
              label="Production Stage"
              color="text-rose-400"
              icon={<Icons.Production />}
            />
            <TypePill
              type="staging"
              label="Quality Control"
              color="text-amber-400"
              icon={<Icons.Staging />}
            />
            <TypePill
              type="development"
              label="Active Dev"
              color="text-blue-400"
              icon={<Icons.Development />}
            />
            <TypePill
              type="other"
              label="Custom / Misc"
              color="text-cyan-400"
              icon={<Icons.Other />}
            />
          </div>
        </div>

        {/* Environments Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Syincing Worlds
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {environments.map((env) => {
              const styles = getEnvironmentColor(env.type);
              return (
                <div
                  key={env.id}
                  className={`group relative bg-linear-to-br ${styles.bg} border ${styles.border} rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full`}
                >
                  <div
                    className={`absolute -top-12 -right-12 w-24 h-24 ${styles.glow} blur-[60px] rounded-full pointer-events-none opacity-50`}
                  ></div>

                  <div className="flex items-start justify-between mb-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-2.5 rounded-xl bg-white/5 ${styles.accent} border border-white/5`}
                        >
                          {styles.icon}
                        </div>
                        <div>
                          <h3
                            className={`text-2xl font-extrabold tracking-tight ${styles.accent}`}
                          >
                            {env.name}
                          </h3>
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                            {env.type} level
                          </span>
                        </div>
                      </div>
                      {env.description && (
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium line-clamp-2">
                          {env.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingEnvironment(env)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all hover:bg-white/10"
                        title="Edit environment"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => {
                          setEnvToDelete(env);
                          setShowDeleteModal(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-rose-400 transition-all hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent"
                        title="Delete environment"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      DEP. {new Date(env.created_at).toLocaleDateString()}
                    </span>
                    <a
                      href={`/spaces/${spaceId}/environments/${env.slug}`}
                      className={`inline-flex items-center gap-2 text-sm font-bold ${styles.accent} hover:underline underline-offset-4 tracking-tight`}
                    >
                      Connect
                      <Icons.ArrowRight />
                    </a>
                  </div>
                </div>
              );
            })}

            {environments.length === 0 && (
              <div className="col-span-full py-24 text-center card border-dashed border-2 bg-transparent flex flex-col items-center justify-center gap-6">
                <div className="text-6xl grayscale opacity-40">🌍</div>
                <h4 className="text-2xl font-bold text-white">Dimension Gap</h4>
                <p className="text-slate-500 max-w-sm mx-auto">
                  This space exists in a vacuum. Create a staging or production
                  environment to bridge the gap.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary px-10!"
                >
                  Bridge Dimension
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        id="env-modal"
        isOpen={showCreateModal || showEditModal}
        onClose={resetForms}
        title={editingEnv ? "Edit Environment" : "New Environment"}
      >
        <form
          onSubmit={
            editingEnv ? handleEditEnvironment : handleCreateEnvironment
          }
          className="space-y-8"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
              Environment Name
            </label>
            <input
              type="text"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="e.g., Staging, Production"
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
              Description
            </label>
            <textarea
              value={newEnvDescription}
              onChange={(e) => setNewEnvDescription(e.target.value)}
              placeholder="Optional: Briefly describe this environment stage"
              className="w-full bg-slate-950/40 border border-white/5 rounded-4xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all h-28 resize-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">
              Environment Type
            </label>
            <div className="grid grid-cols-2 gap-3 pb-2">
              {ENVIRONMENT_TYPES.map((type) => {
                const colors = getEnvironmentColor(type);
                const isActive = newEnvType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewEnvType(type)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all border ${
                      isActive
                        ? `${colors.accent} ${colors.border} bg-white/5 shadow-lg shadow-white/5`
                        : "bg-slate-950/40 border-transparent text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    <div
                      className={isActive ? colors.accent : "text-slate-700"}
                    >
                      {colors.icon}
                    </div>
                    <span className="text-xs uppercase tracking-widest">
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={resetForms}
              className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary py-4! shadow-xl shadow-cyan-500/20"
            >
              {isSubmitting
                ? "Saving..."
                : editingEnv
                  ? "Save Changes"
                  : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        id="delete-confirm-modal"
        isOpen={showDeleteModal}
        onClose={resetForms}
        title="Confirm Deletion"
      >
        <div className="space-y-8">
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-4xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
              <Icons.Delete />
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">Delete Stage?</p>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                You are about to permanently remove the{" "}
                <span className="text-rose-400 font-bold">
                  "{envToDelete?.name}"
                </span>{" "}
                environment. This will affect all flags within this environment.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetForms}
              disabled={isSubmitting}
              className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Back Out
            </button>
            <button
              onClick={handleDeleteEnvironment}
              disabled={isSubmitting}
              className="flex-1 btn-primary py-4! shadow-xl shadow-rose-500/20 bg-linear-to-r! from-rose-600! to-red-700!"
            >
              {isSubmitting ? "Processing..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TypePill({
  type,
  label,
  color,
  icon,
}: {
  type: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 bg-[#0b0e14]/50 border border-white/5 px-5 py-4 rounded-3xl hover:border-white/10 transition-all group">
      <div
        className={`${color} bg-white/5 p-2 rounded-xl group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">
          {type} tier
        </p>
        <p className="text-xs font-bold text-white tracking-tight">{label}</p>
      </div>
    </div>
  );
}
