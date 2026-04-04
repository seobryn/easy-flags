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
    currentTab === tab 
      ? "text-cyan-400 after:w-full after:bg-cyan-500 after:shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
      : "text-slate-500 hover:text-slate-200 after:w-0";

  return (
    <div className="space-y-10 mb-12 animate-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <a
            href="/spaces"
            className="group flex items-center gap-2 text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 transition-all"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Workspace
          </a>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={`/spaces/${spaceId}`}
              className="text-3xl md:text-4xl font-extrabold font-display text-white hover:text-cyan-400 transition-colors tracking-tight"
              title="Go to space overview"
            >
              {spaceName || `Space ${spaceId}`}
            </a>
            {subPage && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <h1 className="text-3xl md:text-4xl font-extrabold font-display text-gradient tracking-tight">
                  {subPage.name}
                </h1>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative border-b border-white/5">
        <nav className="flex gap-4 md:gap-10 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Overview", path: `/spaces/${spaceId}` },
            { id: "environments", label: "Environments", path: `/spaces/${spaceId}/environments` },
            { id: "features", label: "Features", path: `/spaces/${spaceId}/features` },
            { id: "permissions", label: "Access Control", path: `/spaces/${spaceId}/permissions` },
          ].map((tab) => (
            <a
              key={tab.id}
              href={tab.path}
              className={`relative pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:h-[2px] after:transition-all after:duration-300 ${isActive(tab.id)}`}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
