import { useState, useEffect } from "react";
import SpaceNavigation from "@/components/react/shared/SpaceNavigation";
import { Modal } from "@/components/react/shared/Modals";
import { useTranslate } from "@/infrastructure/i18n/context";
import { Icon } from "@/components/react/shared/Icon";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

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
  initialLocale?: AvailableLanguages;
}

const ENVIRONMENT_TYPES: EnvironmentType[] = [
  "production",
  "staging",
  "development",
  "other",
];

const getEnvironmentColor = (type: EnvironmentType) => {
  switch (type) {
    case "production":
      return {
        bg: "from-rose-500/10 to-rose-600/5",
        border: "border-rose-500/20",
        accent: "text-rose-400",
        badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        icon: "Shield" as const,
        glow: "bg-rose-500/10",
      };
    case "staging":
      return {
        bg: "from-amber-500/10 to-amber-600/5",
        border: "border-amber-500/20",
        accent: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        icon: "Activity" as const,
        glow: "bg-amber-500/10",
      };
    case "development":
      return {
        bg: "from-blue-500/10 to-blue-600/5",
        border: "border-blue-500/20",
        accent: "text-blue-400",
        badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        icon: "Zap" as const,
        glow: "bg-blue-500/10",
      };
    case "other":
    default:
      return {
        bg: "from-cyan-500/10 to-cyan-600/5",
        border: "border-cyan-500/20",
        accent: "text-cyan-400",
        badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        icon: "Info" as const,
        glow: "bg-cyan-500/10",
      };
  }
};

export default function EnvironmentsView({
  spaceId,
  spaceName,
  initialLocale,
}: EnvironmentsViewProps) {
  const t = useTranslate(initialLocale);
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
        setError(t('environments.fetchError'));
      }
    } catch (err) {
      console.error("Error fetching environments:", err);
      setError(t('environments.loadError'));
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
        setError(t('environments.createError'));
      }
    } catch (err) {
      console.error("Error creating environment:", err);
      setError(t('environments.createErrorDesc'));
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
        setError(t('environments.updateError'));
      }
    } catch (err) {
      console.error("Error updating environment:", err);
      setError(t('environments.updateErrorDesc'));
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
        setError(t('environments.deleteError'));
      }
    } catch (err) {
      console.error("Error deleting environment:", err);
      setError(t('environments.deleteErrorDesc'));
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
        initialLocale={initialLocale}
      />

      <div className="mt-16">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Icon name="Trash" size={16} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-rose-400 font-bold text-sm">{t('environments.criticalError')}</p>
              <p className="text-rose-500/80 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                {t('environments.title')}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                {t('environments.description')}
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
              <Icon name="Plus" size={20} />
              {t('environments.newEnv')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TypePill
              type="production"
              label={t('environments.prodStage')}
              color="text-rose-400"
              iconName="Shield"
              initialLocale={initialLocale}
            />
            <TypePill
              type="staging"
              label={t('environments.qcStage')}
              color="text-amber-400"
              iconName="Activity"
              initialLocale={initialLocale}
            />
            <TypePill
              type="development"
              label={t('environments.devStage')}
              color="text-blue-400"
              iconName="Zap"
              initialLocale={initialLocale}
            />
            <TypePill
              type="other"
              label={t('environments.customStage')}
              color="text-cyan-400"
              iconName="Info"
              initialLocale={initialLocale}
            />
          </div>
        </div>

        {/* Environments Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {t('environments.syncing')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {environments.map((env) => {
              const styles = getEnvironmentColor(env.type);
              return (
                <div
                  key={env.id}
                  className={`group relative bg-linear-to-br ${styles.bg} border ${styles.border} rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full`}
                >
                  <div
                    className={`absolute -top-12 -right-12 w-24 h-24 ${styles.glow} blur-3xl rounded-full pointer-events-none opacity-50`}
                  ></div>

                  <div className="flex items-start justify-between mb-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-2.5 rounded-xl bg-white/5 ${styles.accent} border border-white/5`}
                        >
                          <Icon name={styles.icon} size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3
                            className={`text-2xl font-extrabold tracking-tight ${styles.accent}`}
                          >
                            {env.name}
                          </h3>
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                            {t('environments.level', { type: env.type })}
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
                        title={t('environments.editEnv')}
                      >
                        <Icon name="Edit" size={16} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => {
                          setEnvToDelete(env);
                          setShowDeleteModal(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-rose-400 transition-all hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent"
                        title={t('environments.deleteEnv')}
                      >
                        <Icon name="Trash" size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Icon name="Calendar" size={12} strokeWidth={2.5} />
                      {t('environments.depDate', { date: new Date(env.created_at).toLocaleDateString(t === undefined ? "en-US" : (initialLocale || "en-US")) })}
                    </span>
                    <a
                      href={`/spaces/${spaceId}/environments/${env.slug}`}
                      className={`inline-flex items-center gap-2 text-sm font-bold ${styles.accent} hover:underline underline-offset-4 tracking-tight`}
                    >
                      {t('environments.connect')}
                      <Icon name="ArrowRight" size={16} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              );
            })}

            {environments.length === 0 && (
              <div className="col-span-full py-24 text-center card border-dashed border-2 bg-transparent flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                  <Icon name="Globe" size={40} className="text-slate-600" />
                </div>
                <h4 className="text-2xl font-bold text-white">{t('environments.dimensionGap')}</h4>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {t('environments.vacuumDesc')}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary px-10!"
                >
                  {t('environments.bridgeDimension')}
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
        title={editingEnv ? t('environments.editModalTitle') : t('environments.newModalTitle')}
      >
        <form
          onSubmit={
            editingEnv ? handleEditEnvironment : handleCreateEnvironment
          }
          className="space-y-8"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
              {t('environments.nameLabel')}
            </label>
            <input
              type="text"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder={t('environments.namePlaceholder')}
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
              {t('environments.descLabel')}
            </label>
            <textarea
              value={newEnvDescription}
              onChange={(e) => setNewEnvDescription(e.target.value)}
              placeholder={t('environments.descPlaceholder')}
              className="w-full bg-slate-950/40 border border-white/5 rounded-4xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all h-28 resize-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">
              {t('environments.typeLabel')}
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
                    <Icon 
                      name={colors.icon} 
                      size={20} 
                      strokeWidth={2.5} 
                      className={isActive ? colors.accent : "text-slate-700"} 
                    />
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary py-4! shadow-xl shadow-cyan-500/20"
            >
              {isSubmitting
                ? t('environments.processing')
                : editingEnv
                  ? t('common.save')
                  : t('environments.create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        id="delete-confirm-modal"
        isOpen={showDeleteModal}
        onClose={resetForms}
        title={t('environments.confirmDeleteTitle')}
      >
        <div className="space-y-8">
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-4xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
              <Icon name="Trash" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">{t('environments.deleteStageQ')}</p>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {t('environments.deleteConfirmDesc', { name: envToDelete?.name || "" })}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetForms}
              disabled={isSubmitting}
              className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              {t('environments.backOut')}
            </button>
            <button
              onClick={handleDeleteEnvironment}
              disabled={isSubmitting}
              className="flex-1 btn-primary py-4! shadow-xl shadow-rose-500/20 bg-linear-to-r! from-rose-600! to-red-700!"
            >
              {isSubmitting ? t('environments.processing') : t('environments.confirmDelete')}
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
  iconName,
  initialLocale,
}: {
  type: string;
  label: string;
  color: string;
  iconName: any;
  initialLocale?: AvailableLanguages;
}) {
  const t = useTranslate(initialLocale);
  return (
    <div className="flex items-center gap-4 bg-[#0b0e14]/50 border border-white/1! px-5 py-4 rounded-3xl hover:border-white/10 transition-all group">
      <div
        className={`${color} bg-white/5 p-2 rounded-xl group-hover:scale-110 transition-transform`}
      >
        <Icon name={iconName} size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">
          {t('environments.tier', { type })}
        </p>
        <p className="text-xs font-bold text-white tracking-tight">{label}</p>
      </div>
    </div>
  );
}
