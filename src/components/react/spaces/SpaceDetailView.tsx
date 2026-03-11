import { useEffect, useState } from "react";
import SpaceNavigation from "@/components/react/shared/SpaceNavigation";

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
  // apiKeysCount: number;
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

export default function SpaceDetailView({ spaceId }: SpaceDetailViewProps) {
  const [space, setSpace] = useState<Space | null>(null);
  const [stats, setStats] = useState<SpaceStats>({
    environmentsCount: 0,
    featuresCount: 0,
    teamMembersCount: 0,
    // apiKeysCount: 0,
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
            // fetchApiKeysCount(),
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
      <div className="flex items-center justify-center py-12">
        <div className="text-cyan-400 animate-pulse">Loading space...</div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="card text-center py-12">
          <p className="text-red-400 mb-4">Space not found</p>
          <a href="/spaces" className="text-cyan-400 hover:text-cyan-300">
            Back to Spaces
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <SpaceNavigation
        spaceId={spaceId}
        spaceName={space.name}
        currentTab="overview"
      />

      {/* Header Section with Gradient Background */}
      <div className="mt-12 mb-28 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📦</span>
              <h1 className="text-3xl font-bold text-white">{space.name}</h1>
            </div>
            {space.description && (
              <p className="text-slate-300 text-lg ml-14">
                {space.description}
              </p>
            )}
            <p className="text-slate-500 text-sm ml-14 mt-2">
              Created{" "}
              {new Date(space.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Top Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
        {/* Environments */}
        <div className="group card bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="text-4xl">🌍</div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
              {stats.environmentsCount}
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3 font-medium">
            Environments
          </p>
          <p className="text-2xl font-bold text-blue-300 mb-4">
            {stats.environmentsCount === 0
              ? "No environments"
              : stats.environmentsCount === 1
                ? "1 environment"
                : `${stats.environmentsCount} environments`}
          </p>
          <p className="text-xs text-slate-500 mb-6">Configured</p>
          <a
            href={`/spaces/${spaceId}/environments`}
            className="inline-block text-blue-400 hover:text-blue-300 text-sm font-semibold"
          >
            Manage →
          </a>
        </div>

        {/* Features */}
        <div className="group card bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="text-4xl">⚙️</div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
              {stats.featuresCount}
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3 font-medium">Features</p>
          <p className="text-2xl font-bold text-purple-300 mb-4">
            {stats.featuresCount === 0
              ? "No features"
              : stats.featuresCount === 1
                ? "1 feature"
                : `${stats.featuresCount} features`}
          </p>
          <p className="text-xs text-slate-500 mb-6">Active and configured</p>
          <a
            href={`/spaces/${spaceId}/features`}
            className="inline-block text-purple-400 hover:text-purple-300 text-sm font-semibold"
          >
            Manage →
          </a>
        </div>

        {/* Team Members */}
        <div className="group card bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="text-4xl">👥</div>
            <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded">
              {stats.teamMembersCount}
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3 font-medium">
            Team Members
          </p>
          <p className="text-2xl font-bold text-green-300 mb-4">
            {stats.teamMembersCount === 0
              ? "No members"
              : stats.teamMembersCount === 1
                ? "1 member"
                : `${stats.teamMembersCount} members`}
          </p>
          <p className="text-xs text-slate-500 mb-6">Space collaborators</p>
          <a
            href={`/spaces/${spaceId}/permissions`}
            className="inline-block text-green-400 hover:text-green-300 text-sm font-semibold"
          >
            Manage →
          </a>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Space Details and Actions - Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions Card */}
          <div className="card p-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-8 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href={`/spaces/${spaceId}/environments`}
                className="group overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 p-6 text-center"
              >
                <div className="relative">
                  <p className="text-3xl mb-3">🌍</p>
                  <p className="font-semibold text-white text-sm">
                    Configure Environments
                  </p>
                </div>
              </a>

              <a
                href={`/spaces/${spaceId}/features`}
                className="group overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 p-6 text-center"
              >
                <div className="relative">
                  <p className="text-3xl mb-3">⚙️</p>
                  <p className="font-semibold text-white text-sm">
                    Manage Features
                  </p>
                </div>
              </a>

              <a
                href={`/spaces/${spaceId}/permissions`}
                className="group overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 p-6 text-center"
              >
                <div className="relative">
                  <p className="text-3xl mb-3">👥</p>
                  <p className="font-semibold text-white text-sm">
                    Team & Permissions
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="card p-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-8 flex items-center gap-2">
              <span>📋</span> Recent Activity
            </h3>
            <div className="space-y-5">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all"
                  >
                    <span className="text-2xl flex-shrink-0">
                      {activity.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {activity.action}:{" "}
                        <span className="text-cyan-300">{activity.name}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">
                    No recent activity yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Space Details Card */}
          <div className="card p-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
            <h3 className="text-lg font-bold text-cyan-300 mb-8 flex items-center gap-2">
              <span>ℹ️</span> Space Details
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Name
                </p>
                <p className="text-white font-medium text-lg">{space.name}</p>
              </div>
              {space.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Description
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {space.description}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Created
                </p>
                <p className="text-white text-sm">
                  {new Date(space.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="pt-6 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Space ID
                </p>
                <p className="text-cyan-400 font-mono text-sm">{space.id}</p>
              </div>
            </div>
          </div>

          {/* Getting Started Card */}
          <div className="card p-8 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30">
            <h3 className="text-lg font-bold text-emerald-300 mb-8 flex items-center gap-2">
              <span>🚀</span> Getting Started
            </h3>
            <ol className="space-y-5 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400 flex-shrink-0">
                  1.
                </span>
                <span>Create environments (Prod, Staging, Dev)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400 flex-shrink-0">
                  2.
                </span>
                <span>Add feature flags for your app</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400 flex-shrink-0">
                  3.
                </span>
                <span>Invite your team members</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400 flex-shrink-0">
                  4.
                </span>
                <span>Integrate with your application</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
