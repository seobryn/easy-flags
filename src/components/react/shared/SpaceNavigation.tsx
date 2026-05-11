import { useTranslate, useLocalizedPath } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "./Icon";

interface SpaceNavigationProps {
  spaceId: string | undefined;
  spaceName?: string;
  currentTab?: "overview" | "environments" | "features" | "permissions";
  subPage?: {
    name: string;
    path?: string;
  };
  initialLocale?: AvailableLanguages;
}

export default function SpaceNavigation({
  spaceId,
  spaceName,
  currentTab = "overview",
  subPage,
  initialLocale,
}: SpaceNavigationProps) {
  const t = useTranslate(initialLocale);
  const l = useLocalizedPath();

  const isActive = (tab: string) =>
    currentTab === tab
      ? "text-cyan-400 after:w-full after:bg-linear-to-r after:from-cyan-500 after:to-blue-500 after:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
      : "text-slate-500 hover:text-slate-200 after:w-0";

  return (
    <div className="space-y-12 mb-16 animate-in slide-in-from-left-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <a
            href={l("/spaces")}
            className="group flex items-center gap-2 text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-6 transition-all"
          >
            <Icon
              name="ArrowRight"
              size={12}
              className="transition-transform group-hover:-translate-x-1 rotate-180"
            />
            {t("spaces.backToSpace")}
          </a>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={l(`/spaces/${spaceId}`)}
              className="text-4xl md:text-5xl font-extrabold font-display text-white hover:text-cyan-400 transition-all duration-300 tracking-tight leading-tight"
              title={t("spaces.goOverview")}
            >
              {spaceName || t("spaces.spaceLabel", { id: spaceId || "" })}
            </a>
            {subPage && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800 hidden md:block" />
                <h1 className="text-4xl md:text-5xl font-extrabold font-display text-gradient tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  {subPage.name}
                </h1>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative group/nav overflow-x-auto no-scrollbar">
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/5"></div>
        <nav className="flex gap-4 md:gap-12 relative">
          {[
            {
              id: "overview",
              label: t("common.overview"),
              path: `/spaces/${spaceId}`,
            },
            {
              id: "environments",
              label: t("navigation.environments"),
              path: `/spaces/${spaceId}/environments`,
            },
            {
              id: "features",
              label: t("navigation.flags"),
              path: `/spaces/${spaceId}/features`,
            },
            {
              id: "permissions",
              label: t("spaces.accessControl"),
              path: `/spaces/${spaceId}/permissions`,
            },
          ].map((tab) => (
            <a
              key={tab.id}
              href={tab.path}
              className={`relative pb-6 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:h-[3px] after:rounded-full after:transition-all after:duration-500 ${isActive(tab.id)} active:scale-95`}
            >
              <span className="relative z-10">{tab.label}</span>
              {currentTab === tab.id && (
                <div className="absolute inset-0 bg-cyan-500/5 blur-xl -z-10 rounded-full"></div>
              )}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
