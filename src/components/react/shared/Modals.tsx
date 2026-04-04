import { useState } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "./Icon";

interface ModalsProps {
  initialLocale?: AvailableLanguages;
}

export default function Modals({ initialLocale }: ModalsProps) {
  const t = useTranslate(initialLocale);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      {/* Create Environment Modal */}
      <Modal
        id="create-environment-modal"
        isOpen={activeModal === "environment"}
        onClose={closeModal}
        title={t('environments.createTitle')}
        initialLocale={initialLocale}
      >
        <form className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              {t('environments.nameLabel')}
            </label>
            <input
              type="text"
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              placeholder={t('environments.namePlaceholder')}
            />
          </div>
          <div className="flex gap-4 justify-end pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-3 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-3! shadow-lg shadow-cyan-500/20"
            >
              {t('common.create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Feature Modal */}
      <Modal
        id="create-feature-modal"
        isOpen={activeModal === "feature"}
        onClose={closeModal}
        title={t('features.createTitle')}
        initialLocale={initialLocale}
      >
        <form className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              {t('features.keyLabel')}
            </label>
            <input
              type="text"
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-mono text-sm"
              placeholder={t('features.keyPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">
              {t('features.descLabel')}
            </label>
            <textarea
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all h-32 resize-none text-sm leading-relaxed"
              placeholder={t('features.descPlaceholder')}
            />
          </div>
          <div className="flex gap-4 justify-end pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-3 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-3! shadow-lg shadow-cyan-500/20"
            >
              {t('common.create')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function Modal({
  id,
  isOpen,
  onClose,
  title,
  children,
  initialLocale,
}: {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  initialLocale?: AvailableLanguages;
}) {
  const t = useTranslate(initialLocale);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#06080f]/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#0b0e14]/95 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Fixed Top Gradient Line - now centered and faded at the edges to avoid corner issues */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-linear-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold font-display tracking-tight text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            aria-label={t('common.close')}
          >
            <Icon name="X" size={18} strokeWidth={3} />
          </button>
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
