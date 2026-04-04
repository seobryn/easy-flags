import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface QuickStartSectionProps {
  initialLocale?: AvailableLanguages;
}

export default function QuickStartSection({ initialLocale }: QuickStartSectionProps) {
  const t = useTranslate(initialLocale);

  const resources = [
    {
      icon: <Icon name="FileText" size={24} />,
      title: t('quickstart.documentation'),
      description: t('quickstart.documentationDesc'),
      href: "/docs",
    },
    {
      icon: <Icon name="Zap" size={24} />,
      title: t('quickstart.apiReference'),
      description: t('quickstart.apiReferenceDesc'),
      href: "/api-reference",
    },
    {
      icon: <Icon name="MessageSquare" size={24} />,
      title: t('quickstart.support'),
      description: t('quickstart.supportDesc'),
      href: "/contact",
    },
  ];

  return (
    <section className="mt-16 mb-20 relative max-w-7xl mx-auto px-4" aria-labelledby="quickstart-heading">
      <div className="flex flex-col items-center mb-10 text-center">
        <h2
          id="quickstart-heading"
          className="section-title text-center"
        >
          {t('quickstart.title')}
        </h2>
        <p className="text-slate-400 max-w-2xl">
          {t('quickstart.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <a
            key={resource.href}
            href={resource.href}
            className="card group flex flex-col items-start text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl mb-6 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-colors">
              {resource.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              {resource.title}
            </h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              {resource.description}
            </p>
            <div className="mt-auto flex items-center text-cyan-500 font-semibold group-hover:translate-x-1 transition-transform">
              Explore <Icon name="ChevronRight" size={16} className="ml-1" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
