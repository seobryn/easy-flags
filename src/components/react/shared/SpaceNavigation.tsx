interface SpaceNavigationProps {
  spaceId: string | undefined;
  spaceName?: string;
  currentTab?: "overview" | "environments" | "features" | "permissions";
  subPage?: {
    name: string;
    path?: string;
  };
}

export default function SpaceNavigation({
  spaceId,
  spaceName,
  currentTab = "overview",
  subPage,
}: SpaceNavigationProps) {
  const isActive = (tab: string) =>
    currentTab === tab ? "border-b-2 border-cyan-400 text-cyan-300" : "";

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <a
            href="/spaces"
            className="text-cyan-400 hover:text-cyan-300 text-sm mb-2 inline-block"
          >
            ← Back to Spaces
          </a>
          <div className="flex items-center gap-2">
            <a
              href={`/spaces/${spaceId}`}
              className="text-3xl font-bold text-gradient hover:opacity-80 transition"
              title="Go to space overview"
            >
              {spaceName || `Space ${spaceId}`}
            </a>
            {subPage && (
              <>
                <span className="text-slate-500">/</span>
                <a
                  href={subPage.path || `#`}
                  className="text-3xl font-bold text-slate-300 hover:text-cyan-300 transition"
                  title={`Go to ${subPage.name}`}
                >
                  {subPage.name}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-8">
          <a
            href={`/spaces/${spaceId}`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("overview")}`}
          >
            Overview
          </a>
          <a
            href={`/spaces/${spaceId}/environments`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("environments")}`}
          >
            Environments
          </a>
          <a
            href={`/spaces/${spaceId}/features`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("features")}`}
          >
            Features
          </a>
          <a
            href={`/spaces/${spaceId}/permissions`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("permissions")}`}
          >
            Team & Permissions
          </a>
        </nav>
      </div>
    </div>
  );
}
