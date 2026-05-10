import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { useTranslate, useLocalizedPath } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface Space {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
}

interface SpaceStats {
  environmentsCount: number;
  featuresCount: number;
  teamMembersCount: number;
  recentActivity: Array<{
    icon: string;
    action: string;
    name: string;
    time: string;
  }>;
}

interface SpaceDetailViewProps {
  spaceId: string | undefined;
  initialLocale?: AvailableLanguages;
}


export default function SpaceDetailView({ spaceId, initialLocale }: SpaceDetailViewProps) {
  const t = useTranslate(initialLocale);
  const l = useLocalizedPath();
  const [space, setSpace] = useState<Space | null>(null);
  const [stats, setStats] = useState<SpaceStats>({
    environmentsCount: 0,
    featuresCount: 0,
    teamMembersCount: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await fetch(`/api/spaces/${spaceId}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setSpace(data);

          // Fetch stats
          await Promise.all([
            fetchEnvironmentsCount(),
            fetchFeaturesCount(),
            fetchTeamMembersCount(),
          ]);
        } else {
          setSpace(null);
        }
      } catch (error) {
        console.error("Failed to fetch space:", error);
        setSpace(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (spaceId) {
      fetchSpace();
    }
  }, [spaceId]);

  const fetchEnvironmentsCount = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/environments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 0;
        setStats((prev) => ({
          ...prev,
          environmentsCount: count,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch environments:", error);
    }
  };

  const fetchFeaturesCount = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/features`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 0;
        setStats((prev) => ({
          ...prev,
          featuresCount: count,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch features:", error);
    }
  };

  const fetchTeamMembersCount = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/team-members`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 0;
        setStats((prev) => ({
          ...prev,
          teamMembersCount: count,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('spaces.loadingDetails')}</p>
        </div>
    );
  }

  if (!space) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 h-screen flex items-center justify-center">
        <div className="card text-center p-12 border-dashed border-2 border-white/10 bg-transparent max-w-md">
          <div className="text-6xl mb-6">🛰️</div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('spaces.notFoundTitle')}</h2>
          <p className="text-slate-500 mb-8 font-medium">{t('spaces.notFoundDesc')}</p>
          <a href={l("/spaces")} className="btn-primary px-8!">
            {t('spaces.returnToBase')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <PageContainer spaceId={spaceId} spaceName={space.name} currentTab="overview" initialLocale={initialLocale}>
      <div className="space-y-12 animate-in fade-in duration-1000">
        
        {/* Hero Section */}
        <div className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-[40px] p-8 md:p-14 transition-all hover:bg-white/[0.04] hover:border-white/10">
          <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-400/10 to-blue-600/10 flex items-center justify-center text-cyan-400 border border-cyan-500/10 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                  <Icon name="Box" size={28} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    {t('spaces.overviewHeader')}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    {space.name}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <Icon name="Calendar" size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(space.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <Icon name="Hash" size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {space.id}</span>
                </div>
              </div>
            </div>
            
            {space.description && (
              <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-4xl font-medium">
                {space.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StatCard 
            title={t('navigation.environments')} 
            count={stats.environmentsCount} 
            icon={<Icon name="Globe" size={28} />} 
            color="cyan" 
            link={`/spaces/${spaceId}/environments`}
            label={t('spaces.infrastructure')}
            t={t}
          />
          <StatCard 
            title={t('navigation.flags')} 
            count={stats.featuresCount} 
            icon={<Icon name="Settings" size={28} />} 
            color="purple" 
            link={`/spaces/${spaceId}/features`}
            label={t('spaces.controls')}
            t={t}
          />
          <StatCard 
            title={t('navigation.members')} 
            count={stats.teamMembersCount} 
            icon={<Icon name="Users" size={28} />} 
            color="emerald" 
            link={`/spaces/${spaceId}/permissions`}
            label={t('spaces.collaboration')}
            t={t}
          />
        </div>

        {/* Detail Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          
          <div className="lg:col-span-2 space-y-12">
            {/* Quick Actions */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                  <Icon name="Zap" size={16} className="text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{t('spaces.quickActions')}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionLink 
                    href={l(`/spaces/${spaceId}/environments`)}
                    title={t('spaces.deployEnv')}
                    description={t('spaces.deployEnvDesc')}
                    icon={<Icon name="Globe" size={24} />}
                />
                <ActionLink 
                    href={l(`/spaces/${spaceId}/features`)}
                    title={t('spaces.newFlag')}
                    description={t('spaces.newFlagDesc')}
                    icon={<Icon name="Settings" size={24} />}
                />
                <ActionLink 
                    href={l(`/spaces/${spaceId}/permissions`)}
                    title={t('spaces.inviteMembers')}
                    description={t('spaces.inviteMembersDesc')}
                    icon={<Icon name="Users" size={24} />}
                />
                <ActionLink 
                    href={l("/docs")}
                    title={t('spaces.sdkIntegration')}
                    description={t('spaces.sdkIntegrationDesc')}
                    icon={<Icon name="FileText" size={24} />}
                />
                <ActionLink 
                    href={l("/api-reference")}
                    title={t('apiReference.title')}
                    description={t('apiReference.shortDesc')}
                    icon={<Icon name="Zap" size={24} />}
                />
              </div>
            </section>

            {/* Activity */}
            <section>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                  <Icon name="Activity" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{t('spaces.recentActivity')}</h3>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Timeline</p>
                </div>
              </div>

              {stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, idx) => (
                    <div key={idx} className="group bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-3xl p-5 flex items-center gap-6 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {activity.icon}
                       </div>
                       <div className="flex-1">
                          <p className="text-base text-white font-semibold">
                            {activity.action}: <span className="text-cyan-400">{activity.name}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{activity.time}</p>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.01] backdrop-blur-sm border border-dashed border-white/10 rounded-[32px] py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-slate-600">
                    <Icon name="Activity" size={32} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">{t('spaces.noActivity')}</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-linear-to-br from-cyan-500/10 to-blue-600/5 border border-white/5 rounded-3xl p-8 sticky top-12">
               <div className="flex items-center gap-3 mb-8">
                  <Icon name="Info" size={20} />
                  <h4 className="font-bold text-white tracking-tight">{t('spaces.deployGuide')}</h4>
               </div>

               <div className="space-y-8">
                  <Step num="01" text={t('spaces.step1')} />
                  <Step num="02" text={t('spaces.step2')} />
                  <Step num="03" text={t('spaces.step3')} />
                  <Step num="04" text={t('spaces.step4')} />
               </div>

               <div className="mt-10 pt-8 border-t border-white/5">
                  <a 
                    href={l("/docs")} 
                    className="flex items-center justify-between group p-4 bg-white/5 rounded-2xl hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 transition-all font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400"
                  >
                    {t('spaces.viewSdkDocs')}
                    <Icon name="ExternalLink" size={14} />
                  </a>
               </div>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({ title, count, icon, color, link, label, t }: { 
    title: string; 
    count: number; 
    icon: React.ReactNode; 
    color: 'cyan' | 'purple' | 'emerald'; 
    link: string;
    label: string;
    t: any;
}) {
  const colors = {
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 hover:border-cyan-400/40 shadow-cyan-400/5",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20 hover:border-purple-400/40 shadow-purple-400/5",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:border-emerald-400/40 shadow-emerald-400/5"
  };

  return (
    <a href={link} className={`group block bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-[40px] p-10 transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(6,182,212,0.1)] overflow-hidden relative`}>
       <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-[60px] rounded-full group-hover:bg-cyan-500/10 transition-all duration-700"></div>
       
       <div className="flex justify-between items-start mb-8 relative z-10">
          <div className={`p-4 rounded-2xl shadow-inner ${colors[color]}`}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.25em] mb-2">{label}</p>
            <p className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">{count}</p>
          </div>
       </div>
       <div className="relative z-10">
         <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 tracking-tight">{title}</h3>
         <p className="text-slate-500 text-sm font-medium leading-relaxed">{t('spaces.statCardDesc', { type: title.toLowerCase() })}</p>
       </div>
    </a>
  );
}

function ActionLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="group flex items-center gap-6 p-6 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-3xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-[#0b0e14] border border-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-inner text-slate-400 group-hover:text-cyan-400">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-white text-base tracking-tight group-hover:text-cyan-400 transition-colors leading-tight mb-1">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
        </div>
    </a>
  );
}

function Step({ num, text }: { num: string; text: string }) {
    return (
        <div className="flex gap-4">
            <span className="text-[10px] font-black text-cyan-500 tracking-widest mt-1">{num}</span>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">{text}</p>
        </div>
    );
}
