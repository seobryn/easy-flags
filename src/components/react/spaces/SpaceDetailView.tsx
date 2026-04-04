import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { useTranslate } from "@/infrastructure/i18n/context";
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
          <a href="/spaces" className="btn-primary px-8!">
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
        <div className="relative group overflow-hidden bg-[#0b0e14]/40 border border-white/5 rounded-4xl p-8 md:p-12 transition-all hover:border-white/10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-cyan-500/15 transition-colors duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <Icon name="Box" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-1">{t('spaces.overviewHeader')}</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                  {space.name}
                </h1>
              </div>
            </div>
            
            {space.description && (
              <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-3xl font-medium mb-8">
                {space.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-500">
                    <Icon name="Calendar" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        {t('spaces.createdDate', { date: new Date(space.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) })}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Icon name="Hash" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('spaces.idLabel', { id: space.id })}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title={t('navigation.environments')} 
            count={stats.environmentsCount} 
            icon={<Icon name="Globe" size={24} />} 
            color="cyan" 
            link={`/spaces/${spaceId}/environments`}
            label={t('spaces.infrastructure')}
            t={t}
          />
          <StatCard 
            title={t('navigation.flags')} 
            count={stats.featuresCount} 
            icon={<Icon name="Settings" size={24} />} 
            color="purple" 
            link={`/spaces/${spaceId}/features`}
            label={t('spaces.controls')}
            t={t}
          />
          <StatCard 
            title={t('navigation.members')} 
            count={stats.teamMembersCount} 
            icon={<Icon name="Users" size={24} />} 
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
                  <span className="text-xs">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{t('spaces.quickActions')}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionLink 
                    href={`/spaces/${spaceId}/environments`}
                    title={t('spaces.deployEnv')}
                    description={t('spaces.deployEnvDesc')}
                    icon={<Icon name="Globe" size={24} />}
                />
                <ActionLink 
                    href={`/spaces/${spaceId}/features`}
                    title={t('spaces.newFlag')}
                    description={t('spaces.newFlagDesc')}
                    icon={<Icon name="Settings" size={24} />}
                />
                <ActionLink 
                    href={`/spaces/${spaceId}/permissions`}
                    title={t('spaces.inviteMembers')}
                    description={t('spaces.inviteMembersDesc')}
                    icon={<Icon name="Users" size={24} />}
                />
                <ActionLink 
                    href={`/docs`}
                    title={t('spaces.sdkIntegration')}
                    description={t('spaces.sdkIntegrationDesc')}
                    icon={<Icon name="FileText" size={24} />}
                />
                <ActionLink 
                    href={`/api-reference`}
                    title={t('apiReference.title')}
                    description={t('apiReference.shortDesc')}
                    icon={<Icon name="Zap" size={24} />}
                />
              </div>
            </section>

            {/* Activity */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Icon name="Activity" size={20} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{t('spaces.recentActivity')}</h3>
              </div>

              {stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, idx) => (
                    <div key={idx} className="group bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
                       <div className="text-xl">{activity.icon}</div>
                       <div className="flex-1">
                          <p className="text-sm text-white font-medium">
                            {activity.action}: <span className="text-cyan-400">{activity.name}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{activity.time}</p>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/2 border border-dashed border-white/10 rounded-2xl py-12 text-center">
                  <p className="text-slate-500 font-medium italic">{t('spaces.noActivity')}</p>
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
                    href="/docs" 
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
    <a href={link} className={`group block bg-white/3 border border-white/5 rounded-4xl p-8 transition-all hover:bg-white/6 hover:-translate-y-1 hover:shadow-2xl`}>
       <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{count}</p>
          </div>
       </div>
       <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 tracking-tight">{title}</h3>
       <p className="text-slate-500 text-sm font-medium">{t('spaces.statCardDesc', { type: title.toLowerCase() })}</p>
    </a>
  );
}

function ActionLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="group flex items-center gap-5 p-5 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/8 hover:border-white/10">
        <div className="w-12 h-12 rounded-xl bg-[#0b0e14] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-white text-sm tracking-tight group-hover:text-cyan-400 transition-colors">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{description}</p>
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
