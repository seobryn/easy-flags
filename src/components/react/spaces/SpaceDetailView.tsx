import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";

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
}

const Icons = {
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  ),
  Rocket: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5"/><path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5"/></svg>
  ),
  ExternalLink: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
  ),
  Hash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
  )
};

export default function SpaceDetailView({ spaceId }: SpaceDetailViewProps) {
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
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Details</p>
        </div>
    );
  }

  if (!space) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 h-screen flex items-center justify-center">
        <div className="card text-center p-12 border-dashed border-2 border-white/10 bg-transparent max-w-md">
          <div className="text-6xl mb-6">🛰️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Space Lost in Orbit</h2>
          <p className="text-slate-500 mb-8 font-medium">The workspace you're looking for doesn't exist or you don't have access.</p>
          <a href="/spaces" className="btn-primary px-8!">
            Return to Base
          </a>
        </div>
      </div>
    );
  }

  return (
    <PageContainer spaceId={spaceId} spaceName={space.name} currentTab="overview">
      <div className="space-y-12 animate-in fade-in duration-1000">
        
        {/* Hero Section */}
        <div className="relative group overflow-hidden bg-[#0b0e14]/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 transition-all hover:border-white/10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-cyan-500/15 transition-colors duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <span className="text-2xl text-white">📦</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-1">Workspace Overview</p>
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
                    <Icons.Calendar />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        Created {new Date(space.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Icons.Hash />
                    <span className="text-[10px] font-bold uppercase tracking-widest">ID: {space.id}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Environments" 
            count={stats.environmentsCount} 
            icon={<Icons.Globe />} 
            color="cyan" 
            link={`/spaces/${spaceId}/environments`}
            label="Infrastructure"
          />
          <StatCard 
            title="Feature Flags" 
            count={stats.featuresCount} 
            icon={<Icons.Settings />} 
            color="purple" 
            link={`/spaces/${spaceId}/features`}
            label="Controls"
          />
          <StatCard 
            title="Team Members" 
            count={stats.teamMembersCount} 
            icon={<Icons.Users />} 
            color="emerald" 
            link={`/spaces/${spaceId}/permissions`}
            label="Collaboration"
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
                <h3 className="text-xl font-bold text-white tracking-tight">Quick Actions</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionLink 
                    href={`/spaces/${spaceId}/environments`}
                    title="Deploy Environment"
                    description="Set up new environments for staging or production"
                    icon="🌍"
                />
                <ActionLink 
                    href={`/spaces/${spaceId}/features`}
                    title="New Feature Flag"
                    description="Create and configure new feature toggles"
                    icon="⚙️"
                />
                <ActionLink 
                    href={`/spaces/${spaceId}/permissions`}
                    title="Invite Members"
                    description="Manage team access and role assignments"
                    icon="👥"
                />
                <ActionLink 
                    href={`/docs`}
                    title="SDK Integration"
                    description="View documentation for technical setup"
                    icon="📚"
                />
              </div>
            </section>

            {/* Activity */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Icons.Activity />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity</h3>
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
                  <p className="text-slate-500 font-medium italic">No recent events recorded in this workspace</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-linear-to-br from-cyan-500/10 to-blue-600/5 border border-white/5 rounded-3xl p-8 sticky top-12">
               <div className="flex items-center gap-3 mb-8">
                  <Icons.Info />
                  <h4 className="font-bold text-white tracking-tight">Deployment Guide</h4>
               </div>

               <div className="space-y-8">
                  <Step num="01" text="Define your infrastructure by creating environments." />
                  <Step num="02" text="Create flags to decouple deployment from release." />
                  <Step num="03" text="Integrate using our premium SDKs and APIs." />
                  <Step num="04" text="Monitor metrics and iterate with confidence." />
               </div>

               <div className="mt-10 pt-8 border-t border-white/5">
                  <a 
                    href="/docs" 
                    className="flex items-center justify-between group p-4 bg-white/5 rounded-2xl hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 transition-all font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400"
                  >
                    View SDK Docs
                    <Icons.ExternalLink />
                  </a>
               </div>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({ title, count, icon, color, link, label }: { 
    title: string; 
    count: number; 
    icon: React.ReactNode; 
    color: 'cyan' | 'purple' | 'emerald'; 
    link: string;
    label: string;
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
       <p className="text-slate-500 text-sm font-medium">Configure and manage your {title.toLowerCase()} configurations.</p>
    </a>
  );
}

function ActionLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
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
