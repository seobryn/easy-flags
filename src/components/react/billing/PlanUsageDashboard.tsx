import React, { useState, useEffect } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface PlanUsageDashboardProps {
  userId: string;
  initialLocale?: AvailableLanguages;
}

interface UsageMetric {
  current: number;
  limit: number;
  percentage: number;
  period?: string;
}

interface UsageData {
  plan: {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
  };
  subscription: {
    status: string;
    current_period_start: string;
    current_period_end: string;
  };
  usage: {
    api_calls: UsageMetric;
    feature_flags: UsageMetric;
    environments: UsageMetric;
    team_members: UsageMetric;
  };
  period: {
    start_date: string;
    end_date: string;
    type: string;
  };
}

interface TimePeriod {
  label: string;
  value: "current_month" | "last_30_days" | "custom";
  startDate: () => Date;
  endDate: () => Date;
}

export default function PlanUsageDashboard({
  userId,
  initialLocale,
}: PlanUsageDashboardProps) {
  const t = useTranslate(initialLocale);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>({
    label: t("billing.currentMonth"),
    value: "current_month",
    startDate: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    },
    endDate: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    },
  });

  const timePeriods: TimePeriod[] = [
    {
      label: t("billing.currentMonth"),
      value: "current_month",
      startDate: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      },
      endDate: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
      },
    },
    {
      label: t("billing.last30Days"),
      value: "last_30_days",
      startDate: () => {
        const now = new Date();
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      },
      endDate: () => new Date(),
    },
  ];

  useEffect(() => {
    fetchUsageData();
  }, [userId, timePeriod.value]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (timePeriod.value === "custom") {
        // For custom periods, we'd need date pickers
        params.append("date_from", timePeriod.startDate().toISOString());
        params.append("date_to", timePeriod.endDate().toISOString());
      }

      const response = await fetch(`/api/billing/usage?${params.toString()}`);
      if (!response.ok) {
        throw new Error(t("billing.failedLoadUsage"));
      }

      const data = await response.json();
      setUsageData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("common.error")
      );
      setUsageData(null);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "red";
    if (percentage >= 80) return "amber";
    if (percentage >= 50) return "blue";
    return "emerald";
  };

  const formatDateRange = () => {
    if (!usageData) return "";
    
    const start = new Date(usageData.period.start_date);
    const end = new Date(usageData.period.end_date);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const exportUsageData = () => {
    if (!usageData) return;
    
    const dataStr = JSON.stringify(usageData, null, 2);
    const dataUri = 
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `usage-data-${new Date().toISOString().split("T")[0]}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          {t("billing.loadingUsage")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
          <Icon name="AlertTriangle" size={20} />
        </div>
        <div>
          <p className="text-red-400 font-bold text-sm">
            {t("billing.failedLoadUsage")}
          </p>
          <p className="text-red-300 text-sm mt-1">
            {error}
          </p>
          <button
            onClick={fetchUsageData}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
        <p className="text-slate-400 mb-2">
          {t("billing.noUsageData")}
        </p>
        <p className="text-slate-500 text-sm">
          {t("billing.noUsageDataDesc")}
        </p>
        <button
          onClick={fetchUsageData}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              {t("billing.planUsage")}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              {t("billing.usageDashboard")}
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-2xl leading-relaxed">
              {t("billing.usageDashboardDesc")}
            </p>
          </div>

           <div className="flex flex-col sm:flex-row gap-4 items-center min-w-fit">
             {/* Current Plan Card - Simple version */}
             <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-center min-w-[200px]">
               <div className="flex items-center justify-center gap-2">
                 <p className="text-xl font-extrabold text-white">
                   {usageData.plan.name}
                 </p>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-full border border-white/20">
                   {usageData.subscription.status}
                 </span>
               </div>
             </div>

             {/* Time Period Selector - Simple version */}
             <div className="relative group">
               <select
                 value={timePeriod.value}
                 onChange={(e) => {
                   const selected = timePeriods.find(tp => tp.value === e.target.value);
                   if (selected) setTimePeriod(selected);
                 }}
                 className="pl-4 pr-10 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white text-sm font-bold focus:outline-none appearance-none cursor-pointer transition-colors hover:border-white/20"
               >
                 {timePeriods.map((period) => (
                   <option key={period.value} value={period.value}>
                     {period.label}
                   </option>
                 ))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                 <Icon name="ChevronDown" size={16} />
               </div>
             </div>

              {/* Export Button - Simple version */}
              <button
                onClick={exportUsageData}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-sm transition-colors shadow-lg"
              >
                <Icon name="RefreshCw" size={16} />
                {t('billing.exportUsage')}
              </button>
           </div>
        </div>

        {/* Date Range Display */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Calendar" size={16} className="text-slate-400" />
            <span className="text-sm text-slate-400 font-medium">
              {formatDateRange()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("billing.safeUsage")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("billing.warningUsage")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("billing.criticalUsage")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UsageMetricCard
          title={t("billing.apiCalls")}
          current={usageData.usage.api_calls.current}
          limit={usageData.usage.api_calls.limit}
          percentage={usageData.usage.api_calls.percentage}
          period={usageData.usage.api_calls.period}
          color={getUsageColor(usageData.usage.api_calls.percentage) as "emerald" | "blue" | "amber" | "red"}
          icon="Zap"
          t={t}
        />
        <UsageMetricCard
          title={t("billing.featureFlags")}
          current={usageData.usage.feature_flags.current}
          limit={usageData.usage.feature_flags.limit}
          percentage={usageData.usage.feature_flags.percentage}
          color={getUsageColor(usageData.usage.feature_flags.percentage) as "emerald" | "blue" | "amber" | "red"}
          icon="Flag"
          t={t}
        />
        <UsageMetricCard
          title={t("billing.environments")}
          current={usageData.usage.environments.current}
          limit={usageData.usage.environments.limit}
          percentage={usageData.usage.environments.percentage}
          color={getUsageColor(usageData.usage.environments.percentage) as "emerald" | "blue" | "amber" | "red"}
          icon="Globe"
          t={t}
        />
        <UsageMetricCard
          title={t("billing.teamMembers")}
          current={usageData.usage.team_members.current}
          limit={usageData.usage.team_members.limit}
          percentage={usageData.usage.team_members.percentage}
          color={getUsageColor(usageData.usage.team_members.percentage) as "emerald" | "blue" | "amber" | "red"}
          icon="Users"
          t={t}
        />
      </div>

      {/* Detailed Usage Table */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="px-10 py-8 border-b border-white/5 bg-slate-950/20">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {t("billing.detailedUsage")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-950/20">
                <th className="pl-10 pr-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {t("billing.metric")}
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {t("billing.currentUsage")}
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {t("billing.planLimit")}
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {t("billing.percentageUsed")}
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  {t("billing.status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {Object.entries(usageData.usage).map(([key, metric]) => (
                <tr
                  key={key}
                  className="group/row hover:bg-white/[0.02] transition-colors"
                >
                  <td className="pl-10 pr-6 py-6 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover/row:bg-purple-500/10 group-hover/row:text-purple-400 transition-colors shadow-inner">
                        {key === "api_calls" && <Icon name="Zap" size={14} />}
                        {key === "feature_flags" && <Icon name="Flag" size={14} />}
                        {key === "environments" && <Icon name="Globe" size={14} />}
                        {key === "team_members" && <Icon name="Users" size={14} />}
                      </div>
                      <span className="font-bold text-slate-300 group-hover/row:text-white transition-colors capitalize">
                        {t(`billing.${key}`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm font-mono font-bold text-blue-400">
                    {metric.current.toLocaleString()}
                  </td>
                  <td className="px-6 py-6 text-sm font-mono font-bold text-slate-400">
                    {metric.limit === -1 ? "∞" : metric.limit.toLocaleString()}
                  </td>
                  <td className="px-6 py-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            getUsageColor(metric.percentage) === "emerald"
                              ? "bg-emerald-500"
                              : getUsageColor(metric.percentage) === "amber"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${metric.percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-xs min-w-[40px] text-right">
                        {metric.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm">
                    {metric.percentage >= 90 && (
                      <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold text-[11px] shadow-sm">
                        {t("billing.critical")}
                      </span>
                    )}
                    {metric.percentage >= 80 && metric.percentage < 90 && (
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-bold text-[11px] shadow-sm">
                        {t("billing.warning")}
                      </span>
                    )}
                    {metric.percentage < 80 && (
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold text-[11px] shadow-sm">
                        {t("billing.normal")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-[40px] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            {t("billing.needMoreCapacity")}
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            {t("billing.upgradePlanDesc")}
          </p>
          <a
            href="/billing"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-2xl font-extrabold text-lg hover:bg-slate-100 transition-colors shadow-lg"
          >
            {t("billing.viewPlans")}
            <Icon name="ArrowRight" size={20} className="transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface UsageMetricCardProps {
  title: string;
  current: number;
  limit: number;
  percentage: number;
  period?: string;
  color: "emerald" | "blue" | "amber" | "red";
  icon: string;
  t: (key: string, params?: any) => string;
}

function UsageMetricCard({ title, current, limit, percentage, period, color, icon, t }: UsageMetricCardProps) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      shadow: "shadow-emerald-500/5",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      shadow: "shadow-blue-500/5",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      shadow: "shadow-amber-500/5",
    },
    red: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      shadow: "shadow-red-500/5",
    },
  };

  return (
    <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 group shadow-lg`}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
            {title}
          </h3>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:text-cyan-400 transition-colors">
            {current.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {t("billing.ofLimit", { limit: limit === -1 ? "∞" : limit.toLocaleString() })}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-500 ${colorMap[color].bg} ${colorMap[color].border} ${colorMap[color].text}`}
        >
          <Icon name={icon as any} size={22} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            {t("billing.usageProgress")}
          </span>
          <span className={`font-bold text-xs ${colorMap[color].text}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${colorMap[color].bg} ${colorMap[color].text}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          {percentage >= 90 
            ? t("billing.criticalUsage")
            : percentage >= 80
            ? t("billing.warningUsage")
            : t("billing.safeUsage")}
        </p>
      </div>

      {/* Period Info */}
      {period && (
        <div className="mt-4 text-xs text-slate-500">
          {t("billing.periodInfo", { period })}
        </div>
      )}
    </div>
  );
}