import React, { useEffect, useState } from "react";
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

interface LimitsSectionProps {
  subscription: UserSubscription | null;
  t: any;
}

export const LimitsSection: React.FC<LimitsSectionProps> = ({ subscription, t }) => {
  const planSlug = subscription?.plan?.slug || "lab";

  // Static mapping for plan limits. In future this can come from the API.
  const staticLimits: Record<
    string,
    { max_flags: number; max_environments: number; max_members: number }
  > = {
    lab: { max_flags: 10, max_environments: 2, max_members: 1 },
    basic: { max_flags: 100, max_environments: 5, max_members: 5 },
    pro: { max_flags: 1000, max_environments: 50, max_members: 50 },
  };

  const staticUsage: Record<
    string,
    { used_flags: number; used_environments: number; used_members: number }
  > = {
    lab: { used_flags: 5, used_environments: 1, used_members: 1 },
    basic: { used_flags: 5, used_environments: 2, used_members: 2 },
    pro: { used_flags: 50, used_environments: 3, used_members: 10 },
  };

  // Live limits fetched from the pricing API for the plan slug. We only
  // fetch plan limits (not per-space usage) when available. Usage counts
  // will be fetched per-space (first space) so the UI shows accurate counts.
  const [liveLimits, setLiveLimits] = useState<{
    max_flags?: number;
    max_environments?: number;
    max_members?: number;
  } | null>(null);

  // Start with null so we don't show static fallback counts before the
  // live fetch completes. This prevents misleading values like "50/∞"
  // appearing when the live API is unavailable or the user isn't
  // authenticated. If fetching fails we fall back to the static values
  // and show a subtle indicator in the UI.
  const [usage, setUsage] = useState<{ used_flags: number; used_environments: number; used_members: number } | null>(
    null,
  );
  const [usedFallback, setUsedFallback] = useState(false);

  // safeT checks the translator result and falls back when the translator
  // returns the key itself (common when a key is missing) or a falsy value.
  const safeT = (key: string, fallback?: string) => {
    if (!t) return fallback ?? key;
    try {
      const out = t(key);
      if (!out || out === key) return fallback ?? key;
      return out;
    } catch (e) {
      return fallback ?? key;
    }
  };

  // Fetch plan-level limits
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/pricing/${planSlug}`);
        if (!res.ok) return;
        const json = await res.json();
        const plan = json?.data;
        const limitsArr = plan?.limits || [];

        const mapped: {
          max_flags?: number;
          max_environments?: number;
          max_members?: number;
        } = {};

        for (const l of limitsArr) {
          if (!l || !l.limit_name) continue;
          const name = String(l.limit_name).toLowerCase();
          const value = Number(l.limit_value);
          if (name === "max_flags") mapped.max_flags = value;
          if (name === "max_environments") mapped.max_environments = value;
          if (name === "max_team_members") mapped.max_members = value;
        }

        if (mounted) setLiveLimits(mapped);
      } catch (err) {
        // Silent fallback to static values
      }
    })();

    return () => {
      mounted = false;
    };
  }, [planSlug]);

  // Fetch per-space usage (use first space as default when no spaceId is provided)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const spacesRes = await fetch(`/api/spaces`, { credentials: "include" });
        if (!spacesRes.ok) return;
        const spacesJson = await spacesRes.json();
        const spaces = spacesJson?.data || spacesJson;
        if (!Array.isArray(spaces) || spaces.length === 0) return;
        const space = spaces[0];
        const slug = space.slug || space.id;

        // Parallel fetch counts
        const [featuresRes, envsRes, membersRes] = await Promise.all([
          fetch(`/api/spaces/${slug}/features`, { credentials: "include" }),
          fetch(`/api/spaces/${slug}/environments`, { credentials: "include" }),
          fetch(`/api/spaces/${slug}/team-members`, { credentials: "include" }),
        ]);

        const [featuresJson, envsJson, membersJson] = await Promise.all([
          featuresRes.ok ? featuresRes.json() : null,
          envsRes.ok ? envsRes.json() : null,
          membersRes.ok ? membersRes.json() : null,
        ]);

        const features = Array.isArray(featuresJson) ? featuresJson : featuresJson?.data || [];
        const envs = Array.isArray(envsJson) ? envsJson : envsJson?.data || [];
        const members = Array.isArray(membersJson) ? membersJson : membersJson?.data || [];

        if (mounted) {
          setUsage({
            used_flags: features.length || 0,
            used_environments: envs.length || 0,
            used_members: members.length || 0,
          });
          setUsedFallback(false);
        }
      } catch (err) {
        // keep static usage if fetch fails
        if (mounted) {
          setUsage(staticUsage[planSlug] || staticUsage.lab);
          setUsedFallback(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [planSlug]);

  // Prefer live limits when available, fall back to static mapping
  const resolvedLimits = {
    max_flags:
      liveLimits?.max_flags ?? staticLimits[planSlug]?.max_flags ?? staticLimits.lab.max_flags,
    max_environments:
      liveLimits?.max_environments ?? staticLimits[planSlug]?.max_environments ?? staticLimits.lab.max_environments,
    max_members:
      liveLimits?.max_members ?? staticLimits[planSlug]?.max_members ?? staticLimits.lab.max_members,
  };
  const limits = resolvedLimits;

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Icon name="Activity" size={18} className="text-cyan-500" />
          </div>
          {t("settings.limits") || "Account Limits"}
        </h2>
        <p className="text-slate-500 text-sm">{t("settings.limitsDesc") || "Limits and quotas for your current plan."}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[32px] p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                  {subscription?.plan?.name || t("billing.currentPlan") || "Plan"}
                </span>
                {subscription?.status === "active" && (
                  <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                    {t("settings.active")}
                  </span>
                )}
              </div>
              <h3 className="text-4xl font-black text-white tracking-tight">{t(`billing.plans.${planSlug}.title`) || subscription?.plan?.name || "Lab"}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
              <p className="text-slate-400 text-sm">{t("limits.maxFlags") || "Max Flags"}</p>
              <p className="text-white text-2xl font-bold mt-2">{limits.max_flags === -1 ? "∞" : limits.max_flags}</p>
               <p className="text-slate-500 text-xs mt-2">{usage === null ? safeT('limits.loading', '...') : t('limits.usage', { used: usage.used_flags, limit: limits.max_flags === -1 ? "∞" : limits.max_flags })}{usedFallback ? ` (${safeT('limits.fallback', 'fallback')})` : ''}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
              <p className="text-slate-400 text-sm">{t("limits.maxEnvironments") || "Max Environments"}</p>
              <p className="text-white text-2xl font-bold mt-2">{limits.max_environments === -1 ? "∞" : limits.max_environments}</p>
               <p className="text-slate-500 text-xs mt-2">{usage === null ? safeT('limits.loading', '...') : t('limits.usage', { used: usage.used_environments, limit: limits.max_environments === -1 ? "∞" : limits.max_environments })}{usedFallback ? ` (${safeT('limits.fallback', 'fallback')})` : ''}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
              <p className="text-slate-400 text-sm">{t("limits.maxMembers") || "Max Team Members"}</p>
              <p className="text-white text-2xl font-bold mt-2">{limits.max_members === -1 ? "∞" : limits.max_members}</p>
               <p className="text-slate-500 text-xs mt-2">{usage === null ? safeT('limits.loading', '...') : t('limits.usage', { used: usage.used_members, limit: limits.max_members === -1 ? "∞" : limits.max_members })}{usedFallback ? ` (${safeT('limits.fallback', 'fallback')})` : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LimitsSection;
