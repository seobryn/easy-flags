import React, { useEffect, useState } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface Space {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  members_count?: number;
  created_at: string;
}


interface SpacesDashboardProps {
  initialLocale?: AvailableLanguages;
}

export default function SpacesDashboard({ initialLocale }: SpacesDashboardProps) {
  const t = useTranslate(initialLocale);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        credentials: "include",
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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('spaces.loading')}</p>
      </div>
    );
  }

  const filteredSpaces = spaces.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 py-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8">
        <div className="max-w-2xl relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
            {(() => {
              const val = t('spaces.yourSpaces');
              const parts = val.split(' ');
              if (parts.length > 1) {
                return (
                  <>
                    {parts[0]}{" "}
                    <span className="text-gradient">
                      {parts.slice(1).join(" ")}
                    </span>
                  </>
                );
              }
              return val;
            })()}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            {t('spaces.dashboardDescription')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Icon name="Search" size={18} />
            </div>
            <input
              type="text"
              placeholder={t('spaces.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3.5! px-8! shadow-xl shadow-cyan-500/20"
          >
            <Icon name="Plus" size={18} />
            {t('spaces.createButton')}
          </button>
        </div>
      </div>

      {/* Hierarchy Schematic */}
      <div className="relative group overflow-hidden bg-[#0b0e14]/50 border border-white/5 rounded-4xl p-8 md:p-10 transition-all hover:border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full group-hover:bg-cyan-500/10 transition-colors"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
           <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Icon name="Folder" size={24} />
           </div>
           <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{t('spaces.systemArch')}</h3>
              <p className="text-slate-500 text-sm">{t('spaces.archDesc')}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-[11px] sm:text-xs">
          <HierNode icon={<Icon name="Box" size={18} />} label={t('spaces.hierSpace')} value="Acme Corp" color="text-cyan-400" />
          <HierNode icon={<Icon name="Globe" size={18} />} label={t('spaces.hierEnv')} value="Production" color="text-emerald-400" />
          <HierNode icon={<Icon name="Globe" size={18} />} label={t('spaces.hierEnv')} value="Staging" color="text-blue-400" />
          <HierNode icon={<Icon name="Settings" size={18} />} label={t('spaces.hierFlags')} value="Ruleset" color="text-purple-400" />
        </div>
      </div>

      {/* Spaces Grid */}
      {spaces.length === 0 ? (
        <div className="card text-center py-20 relative overflow-hidden flex flex-col items-center justify-center border-dashed border-2 border-white/10 bg-transparent">
          <div className="mb-8 opacity-50 group-hover:scale-110 transition-transform duration-500 text-cyan-500">
            <Icon name="Rocket" size={64} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('spaces.launchTitle')}</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">
            {t('spaces.launchDesc')}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 px-10! py-4!"
          >
            <Icon name="Plus" size={18} />
            {t('spaces.buildWorkspace')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <a
              key={space.id}
              href={`/spaces/${space.slug}`}
              className="group relative bg-white/5 border border-white/5 rounded-4xl p-8 transition-all duration-500 hover:bg-white/8 hover:border-cyan-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col h-full"
            >
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-all rotate-45 group-hover:rotate-0">
                 <Icon name="ChevronRight" size={16} />
              </div>
 
               <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                     <Icon name="Folder" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 wrap-break-word tracking-tight">
                    {space.name}
                 </h3>
                 {space.description ? (
                   <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 font-medium">
                     {space.description}
                   </p>
                 ) : (
                   <p className="text-slate-600 text-xs italic font-medium">{t('spaces.noDescription')}</p>
                 )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                  <Icon name="Calendar" size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(space.created_at).toLocaleDateString()}</span>
                </div>
                {space.members_count !== undefined && (
                  <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors">
                    <Icon name="Users" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('spaces.teamCount', { count: space.members_count })}</span>
                  </div>
                )}
              </div>
            </a>
          ))}

          {filteredSpaces.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white/5 rounded-4xl border border-dashed border-white/10">
              <div className="mb-6 grayscale opacity-50 text-cyan-500">
                <Icon name="Search" size={48} className="mx-auto" />
              </div>
              <p className="text-xl font-bold text-white mb-2">{t('spaces.noMatches')}</p>
              <p className="text-slate-500 text-sm mb-6">{t('spaces.noMatchesDesc', { query: searchQuery })}</p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-cyan-400 hover:text-cyan-300 font-bold text-sm underline underline-offset-4 decoration-2"
              >
                {t('spaces.clearSearch')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Simplified Create Modal for this component - re-using the premium style */}
      {showCreateModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#06080f]/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-[#0b0e14]/95 border border-white/10 rounded-4xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header Highlight - centered and faded at edges */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-linear-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">{t('spaces.createModalTitle')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  {t('spaces.modalNameLabel')}
                </label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
                  placeholder={t('spaces.modalNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
                  {t('spaces.modalDescLabel')}
                </label>
                <textarea
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all h-28 resize-none text-sm"
                  placeholder={t('spaces.modalDescPlaceholder')}
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3! text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-primary py-3! shadow-lg shadow-cyan-500/20"
                >
                  {isCreating ? t('spaces.deploying') : t('spaces.createButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HierNode({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/2 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/5">
       <div className="text-xl">{icon}</div>
       <div>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">{label}</p>
          <p className={`font-bold tracking-tight ${color}`}>{value}</p>
       </div>
    </div>
  );
}
