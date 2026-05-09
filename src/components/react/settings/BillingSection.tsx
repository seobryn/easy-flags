import React from "react";
import { Icon } from "@/components/react/shared/Icon";

interface UserSubscription {
  id: number;
  user_id: number;
  pricing_plan_id: number;
  status: "active" | "canceled" | "past_due" | "trial";
  plan?: {
    name: string;
    description: string;
    slug?: string;
  };
}

interface BillingSectionProps {
  subscription: UserSubscription | null;
  t: any;
  l: (path: string) => string;
}

export const BillingSection: React.FC<BillingSectionProps> = ({
  subscription,
  t,
  l,
}) => {
  const planSlug = subscription?.plan?.slug || "lab";
  
  // Get features from translation keys based on the plan slug
  // In a real scenario, these could come from the API too
  const getPlanFeatures = (slug: string) => {
    try {
      // Using a fallback mechanism to get features from t
      // This is a bit manual because t is a function, not an object
      // We know the slugs are 'lab', 'basic', 'pro'
      const featuresKey = `billing.plans.${slug}.features`;
      
      // Since t is a function that usually returns a string, 
      // let's try to get the features array if possible or use a default list
      // This depends on how the i18n helper is implemented.
      // If t can't return arrays, we might need a different approach.
      
      // For now, let's assume we can get them or use a static mapping
      // to ensure visibility if the i18n doesn't support array return directly
      const staticFeatures: Record<string, string[]> = {
        lab: [
          t("billing.plans.lab.features.0"),
          t("billing.plans.lab.features.1"),
          t("billing.plans.lab.features.2"),
          t("billing.plans.lab.features.3"),
        ],
        basic: [
          t("billing.plans.basic.features.0"),
          t("billing.plans.basic.features.1"),
          t("billing.plans.basic.features.2"),
          t("billing.plans.basic.features.3"),
          t("billing.plans.basic.features.4"),
        ],
        pro: [
          t("billing.plans.pro.features.0"),
          t("billing.plans.pro.features.1"),
          t("billing.plans.pro.features.2"),
          t("billing.plans.pro.features.3"),
          t("billing.plans.pro.features.4"),
          t("billing.plans.pro.features.5"),
        ]
      };
      
      return staticFeatures[slug] || [];
    } catch (e) {
      return [];
    }
  };

  const features = getPlanFeatures(planSlug);

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Icon name="CreditCard" size={18} className="text-cyan-500" />
          </div>
          {t("billing.title")}
        </h2>
        <p className="text-slate-500 text-sm">
          {t("settings.profileDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Current Plan Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[32px] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] -z-10 group-hover:bg-cyan-500/10 transition-all duration-700" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                  {t("billing.currentPlan")}
                </span>
                {subscription?.status === "active" && (
                   <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                    {t("settings.active")}
                   </span>
                )}
              </div>
              <h3 className="text-4xl font-black text-white tracking-tight">
                {subscription?.plan?.name || "Lab"}
              </h3>
            </div>
            
            <a 
              href={l("/billing")} 
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
            >
              {t("billing.upgradePlan")}
              <Icon name="ArrowRight" size={16} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-slate-400 leading-relaxed font-medium">
                {subscription?.plan?.description || t("billing.plans.lab.description")}
              </p>
              
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                   {t("billing.whatsIncluded")}
                </p>
                <ul className="space-y-3">
                  {features.map((feature, i) => (
                    feature && (
                      <li key={i} className="flex items-start gap-3 text-slate-300 text-sm group/item">
                        <div className="mt-1 w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 group-hover/item:bg-cyan-500 transition-colors duration-300">
                          <Icon name="Check" size={10} className="text-cyan-400 group-hover/item:text-slate-950 transition-colors" />
                        </div>
                        {feature}
                      </li>
                    )
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-6 border border-white/5 flex flex-col justify-center items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 mb-2">
                    <Icon name="Rocket" size={32} />
                </div>
                <h4 className="text-white font-bold">{t("billing.mostPopular")}</h4>
                <p className="text-slate-500 text-xs px-4">
                    {t("hero.description")}
                </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
