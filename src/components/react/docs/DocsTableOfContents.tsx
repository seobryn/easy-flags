import React, { useState, useEffect, useMemo } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface DocsTableOfContentsProps {
  initialLocale?: AvailableLanguages;
}

import { Icon, type IconName } from "../shared/Icon";

interface Section {
  id: string;
  title: string;
  icon: IconName;
  subsections?: { id: string; title: string }[];
}

export default function DocsTableOfContents({ initialLocale }: DocsTableOfContentsProps) {
  const t = useTranslate(initialLocale);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  const sections: Section[] = useMemo(() => [
    {
      id: "getting-started",
      title: t('docs.gettingStartedTitle'),
      icon: "Rocket",
      subsections: [
        { id: "understanding-hierarchy", title: t('docs.hierarchyTitle') },
      ],
    },
    { id: "creating-spaces", title: t('docs.managingSpacesTitle'), icon: "Box" },
    { id: "creating-features", title: t('docs.managingFeaturesTitle'), icon: "Settings" },
    { id: "environments", title: t('docs.envsTitle'), icon: "Globe" },
    { id: "targeting-rollout", title: t('docs.targetingTitle'), icon: "Target" },
    { id: "api-integration", title: t('docs.apiTitle'), icon: "Zap" },
    { id: "team-management", title: t('docs.teamTitle'), icon: "Users" },
    { id: "troubleshooting", title: t('docs.faqTitle'), icon: "HelpCircle" },
  ], [t]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0% -80% 0%" }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
      section.subsections?.forEach((sub) => {
        const subEl = document.getElementById(sub.id);
        if (subEl) observer.observe(subEl);
      });
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const article = document.querySelector("article");
      if (article) {
        const elementRect = element.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        const scrollOffset = elementRect.top - articleRect.top + article.scrollTop;
        const marginOffset = 100;
        
        article.scrollTo({
          top: scrollOffset - marginOffset,
          behavior: "smooth",
        });
      }
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 md:hidden z-100 w-14 h-14 bg-cyan-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 shadow-cyan-500/20"
      >
        {isOpen ? (
          <Icon name="X" size={24} strokeWidth={2.5} />
        ) : (
          <Icon name="Menu" size={24} strokeWidth={2.5} />
        )}
      </button>

      <nav
        className={`fixed left-0 top-0 h-screen w-80 bg-[#06080f]/80 backdrop-blur-2xl border-r border-white/5 p-8 pt-24 pb-32 overflow-y-auto transition-all duration-500 ease-in-out z-90 md:relative md:pt-10 md:pb-32 lg:w-80 md:translate-x-0 ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full md:opacity-100"
        }`}
      >
        <div className="mb-8 px-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 px-1">
            {t('docs.title')}
          </h2>
          
          <ul className="space-y-1">
            {sections.map((section) => {
              const isActive = activeId === section.id || section.subsections?.some(s => s.id === activeId);
              
              return (
                <li key={section.id} className="group">
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 border ${
                      isActive 
                        ? "bg-cyan-500/10 border-cyan-500/20 text-white font-bold" 
                        : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className={`transition-colors ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-300"}`}>
                      <Icon name={section.icon} size={18} />
                    </span>
                    <span className="text-sm">{section.title}</span>
                  </button>
                  
                  {section.subsections && (
                    <ul className="ml-10 mt-1 space-y-1 overflow-hidden transition-all">
                      {section.subsections.map((sub) => (
                        <li key={sub.id}>
                          <button
                            onClick={() => scrollToSection(sub.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                              activeId === sub.id
                                ? "text-cyan-400 border-transparent font-bold"
                                : "text-slate-500 border-transparent hover:text-slate-300"
                            }`}
                          >
                            {sub.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            
            {/* API Reference Link */}
            <li className="group mt-4 pt-4 border-t border-white/5">
              <a
                href="/api-reference"
                className="w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 border bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              >
                <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
                  <Icon name="Zap" size={18} />
                </span>
                <span className="text-sm font-bold">{t('apiReference.title')}</span>
                <Icon name="ArrowRight" size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-auto px-4 py-6 rounded-2xl bg-linear-to-br from-cyan-500/10 to-blue-500/10 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <p className="text-white text-xs font-bold">{t('docs.proSupport') || 'Pro Support'}</p>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed mb-4">
            {t('docs.proSupportDesc') || 'Need custom architecture help? Contact our flags experts.'}
          </p>
          <a
            href="/contact"
            className="block w-full text-center py-2 rounded-lg bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
          >
            {t('common.getHelp') || 'Get Help'}
          </a>
        </div>
      </nav>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-80 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
