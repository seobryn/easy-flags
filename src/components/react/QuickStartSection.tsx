export default function QuickStartSection() {
  const resources = [
    {
      icon: "📚",
      title: "Documentation",
      description: "Read our comprehensive guides to get started quickly.",
      href: "/docs",
    },
    {
      icon: "🔌",
      title: "API Reference",
      description: "Integrate feature flags into your application.",
      href: "/api-reference",
    },
    {
      icon: "💬",
      title: "Support",
      description: "Get help from our support team or community.",
      href: "/contact",
    },
  ];

  return (
    <section className="mt-10 mb-8" aria-labelledby="quickstart-heading">
      <div className="card">
        <h2
          id="quickstart-heading"
          className="section-title flex items-center gap-2 mb-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="inline w-7 h-7 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          Quick Start
        </h2>
        <p className="text-slate-400 mb-6">
          Everything you need to launch your first feature flag in minutes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              className="group block p-4 rounded-lg border border-cyan-700/20 bg-slate-700/30 hover:bg-slate-700/50 hover:border-cyan-500/50 transition card-hover"
            >
              <div className="text-3xl mb-2">{resource.icon}</div>
              <h3 className="font-semibold text-cyan-300 group-hover:text-cyan-200 transition mb-1">
                {resource.title}
              </h3>
              <p className="text-sm text-slate-400">{resource.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
