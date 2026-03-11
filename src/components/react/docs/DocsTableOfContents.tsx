import { useState } from "react";

interface Section {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    subsections: [
      { id: "understanding-hierarchy", title: "Understanding the Hierarchy" },
    ],
  },
  {
    id: "creating-spaces",
    title: "Creating and Managing Spaces",
  },
  {
    id: "creating-features",
    title: "Creating and Managing Features",
  },
  {
    id: "environments",
    title: "Working with Environments",
  },
  {
    id: "targeting-rollout",
    title: "User Targeting & Rollout Strategies",
  },
  {
    id: "api-integration",
    title: "API Integration",
  },
  {
    id: "team-management",
    title: "Team Management & Roles",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & FAQ",
  },
];

export default function DocsTableOfContents() {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const article = document.querySelector("article");
      if (article) {
        const elementRect = element.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        const scrollOffset =
          elementRect.top - articleRect.top + article.scrollTop;

        // Scroll margin of 112px (scroll-mt-28 = 7rem)
        const marginOffset = 112;
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
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 md:hidden z-40 bg-cyan-500 hover:bg-cyan-400 text-white p-3 rounded-full shadow-lg transition text-xl font-bold"
        aria-label="Toggle table of contents"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Table of Contents */}
      <nav
        className={`fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-slate-800/98 to-slate-900/95 border-r border-cyan-700/40 p-8 pt-28 overflow-y-auto transition-transform duration-300 z-30 md:relative md:w-80 md:pt-8 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden md:block mb-12">
          <h2 className="text-xl font-bold text-gradient bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent mb-2">
            Documentation
          </h2>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
            Navigation
          </p>
          <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-3"></div>
        </div>

        <ul className="space-y-1">
          {sections.map((section, index) => (
            <li key={section.id} className="mb-6 last:mb-0">
              <button
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left px-4 py-3.5 rounded-lg text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-100 hover:translate-x-1 transition-all duration-200 text-sm font-semibold block group"
              >
                <span className="inline-block opacity-60 group-hover:opacity-100 transition-opacity mr-2">
                  {index === 0
                    ? "🚀"
                    : index === 1
                      ? "📦"
                      : index === 2
                        ? "⚙️"
                        : index === 3
                          ? "🌍"
                          : index === 4
                            ? "🎯"
                            : index === 5
                              ? "🔌"
                              : index === 6
                                ? "👥"
                                : "🔍"}
                </span>
                {section.title}
              </button>
              {section.subsections && (
                <ul className="ml-6 mt-3.5 space-y-2.5">
                  {section.subsections.map((subsection) => (
                    <li key={subsection.id}>
                      <button
                        onClick={() => scrollToSection(subsection.id)}
                        className="w-full text-left px-3.5 py-2.5 rounded-lg text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300 hover:translate-x-1 transition-all duration-200 text-xs font-medium block group"
                      >
                        <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                          ▸
                        </span>
                        {subsection.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden md:flex flex-col gap-3 mt-12 pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs">Need help? Visit our</p>
          <a
            href="/contact"
            className="w-full text-center px-4 py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 transition-all duration-200 text-xs font-semibold"
          >
            Contact Support
          </a>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
