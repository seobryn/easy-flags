import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface WhyLoveSectionProps {
  initialLocale?: AvailableLanguages;
}

export default function WhyLoveSection({ initialLocale }: WhyLoveSectionProps) {
  const t = useTranslate(initialLocale);

  const features: Feature[] = [
    {
      icon: "🚀",
      title: t('whyLove.instantRollback'),
      description: t('whyLove.instantRollbackDesc'),
    },
    {
      icon: "👥",
      title: t('whyLove.targetedRollout'),
      description: t('whyLove.targetedRolloutDesc'),
    },
    {
      icon: "📊",
      title: t('whyLove.realTimeAnalytics'),
      description: t('whyLove.realTimeAnalyticsDesc'),
    },
    {
      icon: "🔐",
      title: t('whyLove.enterpriseSecurity'),
      description: t('whyLove.enterpriseSecurityDesc'),
    },
    {
      icon: "⚡",
      title: t('whyLove.highPerformance'),
      description: t('whyLove.highPerformanceDesc'),
    },
    {
      icon: "🔗",
      title: t('whyLove.easyIntegration'),
      description: t('whyLove.easyIntegrationDesc'),
    },
  ];

  return (
    <section className="mt-20 mb-32 relative max-w-7xl mx-auto px-4" aria-labelledby="features-heading">
      <div className="flex flex-col items-center mb-16 text-center">
        <h2
          id="features-heading"
          className="section-title text-4xl md:text-5xl"
        >
          {t('whyLove.title')}
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
          {t('whyLove.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
          >
            {/* Subtle glow on hover */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
