import { useState } from "react";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface LanguageSelectorProps {
  currentLang: AvailableLanguages;
  currentPath: string;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export default function LanguageSelector({ currentLang, currentPath }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <Icon 
          name="ChevronDown" 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
            <div className="py-2">
              {languages.map((lang) => (
                <a
                  key={lang.code}
                  href={`/api/i18n/set-language?lang=${lang.code}&redirect=${encodeURIComponent(currentPath)}`}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200 ${
                    currentLang === lang.code
                      ? "text-cyan-400 bg-cyan-500/5 font-medium"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {currentLang === lang.code && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
