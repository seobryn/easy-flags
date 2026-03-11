interface Feature {
  icon: string;
  title: string;
  description: string;
}

export default function WhyLoveSection() {
  const features: Feature[] = [
    {
      icon: "🚀",
      title: "Instant Rollback",
      description:
        "Roll back any feature instantly without redeploying your application.",
    },
    {
      icon: "👥",
      title: "Targeted Rollout",
      description:
        "Release features to specific user segments and gradually increase visibility.",
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description:
        "Monitor feature adoption and user behavior in real-time dashboards.",
    },
    {
      icon: "🔐",
      title: "Enterprise Security",
      description:
        "Role-based access control with granular permissions for your team.",
    },
    {
      icon: "⚡",
      title: "High Performance",
      description: "Lightning-fast flag evaluations with edge caching support.",
    },
    {
      icon: "🔗",
      title: "Easy Integration",
      description:
        "Simple API and SDK libraries for all major programming languages.",
    },
  ];

  return (
    <section className="mt-12 mb-8" aria-labelledby="features-heading">
      <div>
        <h2
          id="features-heading"
          className="section-title text-3xl md:text-4xl mb-2"
        >
          Why Love Easy Flags?
        </h2>
        <p className="text-slate-400 mb-8">
          Powerful feature flag management built for modern teams.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card bg-slate-800/50 hover:bg-slate-800/70 card-hover group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition transform">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-cyan-300 group-hover:text-cyan-200 transition mb-2 text-lg">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
