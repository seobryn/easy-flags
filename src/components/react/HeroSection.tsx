import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface HeroSectionProps {
  initialLocale?: AvailableLanguages;
}

export default function HeroSection({ initialLocale }: HeroSectionProps) {
  const t = useTranslate(initialLocale);

  return (
    <section className="mt-12 mb-20 relative px-4">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />

      <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 max-w-7xl mx-auto">
        <div className="flex-1 z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            {t('hero.badge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            {t('hero.title')} <br />
            <span className="text-gradient">{t('hero.titleStress')}</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="/create-account"
              className="btn-primary group"
              aria-label={t('hero.getStarted')}
            >
              {t('hero.getStarted')}
              <Icon 
                name="ArrowRight" 
                size={20} 
                className="ml-2 group-hover:translate-x-1 transition-transform" 
              />
            </a>
            <a href="/docs" className="btn-secondary" aria-label={t('hero.documentation')}>
              {t('hero.documentation')}
            </a>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10 w-full lg:w-auto">
          <div className="relative group w-full flex justify-center">
            {/* Extended glow effect */}
            <div className="absolute -inset-4 bg-linear-to-r from-cyan-500/20 to-blue-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
            
            <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <img
              className="relative rounded-3xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full h-auto max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl transform hover:scale-[1.02] transition-transform duration-700"
              src="/illustrations/hero.svg"
              alt={t('hero.illustrationAlt')}
              width="900"
              height="450"
              style={{ animation: "float 6s ease-in-out infinite, fadeIn 1.2s ease-out forwards" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
