import React from "react";
import { Icon, type IconName } from "@/components/react/shared/Icon";

type TabId = "profile" | "security" | "api-keys" | "preferences" | "sessions" | "billing";

interface NavItem {
  id: TabId;
  label: string;
  icon: IconName;
  description: string;
}

interface SettingsSidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  t: (key: string) => string;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  setActiveTab,
  t,
}) => {
  const items: NavItem[] = [
    { 
      id: "profile", 
      label: t("settings.profile"), 
      icon: "User", 
      description: t("settings.profileSidebarDesc")
    },
    { 
      id: "billing", 
      label: t("navigation.billing"), 
      icon: "CreditCard", 
      description: t("settings.billingSidebarDesc")
    },
    { 
      id: "security", 
      label: t("settings.security"), 
      icon: "Lock", 
      description: t("settings.securitySidebarDesc")
    },
    { 
      id: "api-keys", 
      label: t("settings.apiKeys"), 
      icon: "Key", 
      description: t("settings.apiKeysSidebarDesc")
    },
    { 
      id: "preferences", 
      label: t("settings.preferences"), 
      icon: "Shield", 
      description: t("settings.preferencesSidebarDesc")
    },
{
      id: "sessions", 
      label: t("settings.sessions"), 
      icon: "Activity", 
      description: t("settings.sessionsSidebarDesc")
    },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${
              isActive
                ? "bg-white/[0.05] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                : "bg-transparent border border-transparent hover:bg-white/[0.02]"
            }`}
          >
            {/* Active Glow Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyan-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
            )}

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isActive 
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" 
                : "bg-white/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-white/10"
            }`}>
              <Icon name={item.icon} size={20} />
            </div>

            <div className="flex-1 text-left">
              <p className={`font-bold text-sm transition-colors ${
                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
              }`}>
                {item.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 group-hover:text-slate-400 transition-colors uppercase tracking-wider font-semibold">
                {item.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
};
