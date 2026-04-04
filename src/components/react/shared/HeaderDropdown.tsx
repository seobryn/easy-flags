import { useState } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface HeaderDropdownProps {
  username: string;
  isSuperUser?: boolean;
  initialLocale?: AvailableLanguages;
}

export default function HeaderDropdown({
  username,
  isSuperUser = false,
  initialLocale,
}: HeaderDropdownProps) {
  const t = useTranslate(initialLocale);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Logout failed with status:", response.status);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"
      >
        <span>{username}</span>
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#11141d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
          <div className="py-2">
            {isSuperUser && (
              <a
                href="/admin/db-inspector"
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400 transition"
              >
                <Icon name="Database" size={16} />
                <span>{t('admin.dbInspector')}</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-cyan-500/50 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  {t('admin.adminBadge')}
                </span>
              </a>
            )}
            <a
              href="/settings"
              className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-cyan-400 transition"
            >
              <Icon name="Settings" size={16} />
              <span>{t('auth.accountSettings')}</span>
            </a>
          </div>
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/5 transition"
            >
              <Icon name="LogOut" size={16} />
              <span>{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
