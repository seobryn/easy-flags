import { useTranslate, useLocalizedPath } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface SpaceNavigationWithTabsProps {
  spaceId: string | undefined;
  spaceName?: string;
  currentTab?: "overview" | "environments" | "features" | "permissions";
  permissionSubTab?: "space" | "features";
  onPermissionSubTabChange?: (tab: "space" | "features") => void;
  canManageFeaturePermissions?: boolean;
  children?: React.ReactNode;
  initialLocale?: AvailableLanguages;
}

export default function SpaceNavigationWithTabs({
  spaceId,
  spaceName,
  currentTab = "overview",
  permissionSubTab = "space",
  onPermissionSubTabChange,
  canManageFeaturePermissions = false,
  children,
  initialLocale,
}: SpaceNavigationWithTabsProps) {
  const t = useTranslate(initialLocale);
  const l = useLocalizedPath();
  
  const isActive = (tab: string) =>
    currentTab === tab
      ? "text-cyan-400 after:w-full after:bg-cyan-500 after:shadow-[0_0_10px_rgba(6,182,212,0.5)]"
      : "text-slate-500 hover:text-slate-200 after:w-0";

  const isPermissionSubTabActive = (tab: string) =>
    permissionSubTab === tab
      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
      : "text-slate-500 hover:text-slate-300 border border-transparent";

  return (
    <div className="space-y-10 mb-12 animate-in slide-in-from-left-4 duration-500">
      {/* Back Link & Space Name */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <a
            href={l("/spaces")}
            className="group flex items-center gap-2 text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 transition-all"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>{" "}
            {t('spaces.backToSpace')}
          </a>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={`/spaces/${spaceId}`}
              className="text-3xl md:text-4xl font-extrabold font-display text-white hover:text-cyan-400 transition-colors tracking-tight"
              title={t('spaces.goOverview')}
            >
              {spaceName || t('spaces.spaceLabel', { id: spaceId || '' })}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="relative border-b border-white/5">
        <nav className="flex gap-4 md:gap-10 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: t('common.overview'), path: `/spaces/${spaceId}` },
            {
              id: "environments",
              label: t('navigation.environments'),
              path: `/spaces/${spaceId}/environments`,
            },
            {
              id: "features",
              label: t('navigation.flags'),
              path: `/spaces/${spaceId}/features`,
            },
            {
              id: "permissions",
              label: t('spaces.accessControl'),
              path: `/spaces/${spaceId}/permissions`,
            },
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

      {/* Permission Sub-Tabs (Only shown on permissions page) */}
      {currentTab === "permissions" && canManageFeaturePermissions && (
        <div className="flex flex-wrap gap-3 p-1.5 bg-[#0b0e14]/50 border border-white/5 rounded-2xl w-fit">
          <button
            onClick={() => onPermissionSubTabChange?.("space")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isPermissionSubTabActive("space")}`}
          >
            {t('spaces.teamMembership')}
          </button>
          <button
            onClick={() => onPermissionSubTabChange?.("features")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isPermissionSubTabActive("features")}`}
          >
            <span className="text-sm">🔐</span> {t('spaces.rolePermissions')}
          </button>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}
