import React, { useState, useEffect, useMemo } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface DocsTableOfContentsProps {
  initialLocale?: AvailableLanguages;
}

const Icons = {
  Rocket: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"/><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"/></svg>,
  Box: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Globe: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899 15.223 3 13.825 10.101H20l-11.223 11.899L10.175 14.899H4z"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Help: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
};

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
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
      icon: <Icons.Rocket />,
      subsections: [
        { id: "understanding-hierarchy", title: t('docs.hierarchyTitle') },
      ],
    },
    { id: "creating-spaces", title: t('docs.managingSpacesTitle'), icon: <Icons.Box /> },
    { id: "creating-features", title: t('docs.managingFeaturesTitle'), icon: <Icons.Settings /> },
    { id: "environments", title: t('docs.envsTitle'), icon: <Icons.Globe /> },
    { id: "targeting-rollout", title: t('docs.targetingTitle'), icon: <Icons.Target /> },
    { id: "api-integration", title: t('docs.apiTitle'), icon: <Icons.Zap /> },
    { id: "team-management", title: t('docs.teamTitle'), icon: <Icons.Users /> },
    { id: "troubleshooting", title: t('docs.faqTitle'), icon: <Icons.Help /> },
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
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
                      {section.icon}
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
                  <Icons.Zap />
                </span>
                <span className="text-sm font-bold">{t('apiReference.title')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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
