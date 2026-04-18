import { useState, useEffect } from "react";
import type {
  FlagUsageMetric,
  PerformanceMetric,
  FlagImpactAnalysis,
} from "@domain/entities";
import { Icon } from "@/components/react/shared/Icon";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface AnalyticsDashboardProps {
  spaceId: string | undefined;
  environmentId?: string | undefined;
  initialLocale?: AvailableLanguages;
}

interface MetricsData {
  usageMetrics: FlagUsageMetric[];
  performanceMetrics: PerformanceMetric[];
  flagImpact?: FlagImpactAnalysis | null;
  loading: boolean;
  error?: string;
}

export default function AnalyticsDashboard({
  spaceId,
  environmentId,
  initialLocale,
}: AnalyticsDashboardProps) {
  const t = useTranslate(initialLocale);
  const [metricsData, setMetricsData] = useState<MetricsData>({
    usageMetrics: [],
    performanceMetrics: [],
    loading: true,
  });

  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!spaceId) return;

    const fetchMetrics = async () => {
      try {
        setMetricsData((prev) => ({ ...prev, loading: true }));

        const params = new URLSearchParams({
          space_id: spaceId,
          metric_type: "usage",
          date_from: dateRange.from,
          date_to: dateRange.to,
          ...(environmentId && { environment_id: environmentId }),
        });

        const response = await fetch(`/api/analytics/metrics?${params}`);
        if (!response.ok) {
          throw new Error(t('analytics.failedFetch'));
        }

        const usageMetrics = await response.json();

        setMetricsData((prev) => ({
          ...prev,
          usageMetrics,
          loading: false,
        }));
      } catch (error) {
        setMetricsData((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : t('common.error'),
          loading: false,
        }));
      }
    };

    fetchMetrics();
  }, [spaceId, environmentId, dateRange, t]);

  const calculateTotalStats = () => {
    if (metricsData.usageMetrics.length === 0) {
      return {
        totalEvaluations: 0,
        enabledPercentage: 0,
        avgResponseTime: 0,
        errorRate: 0,
      };
    }

    const total = metricsData.usageMetrics.reduce(
      (sum, m) => sum + m.total_evaluations,
      0,
    );
    const enabled = metricsData.usageMetrics.reduce(
      (sum, m) => sum + m.enabled_count,
      0,
    );
    const errors = metricsData.usageMetrics.reduce(
      (sum, m) => sum + m.error_count,
      0,
    );
    const avgTime =
      metricsData.usageMetrics.reduce(
        (sum, m) => sum + m.avg_evaluation_time_ms,
        0,
      ) / metricsData.usageMetrics.length;

    return {
      totalEvaluations: total,
      enabledPercentage: total > 0 ? ((enabled / total) * 100).toFixed(2) : 0,
      avgResponseTime: avgTime.toFixed(2),
      errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) : 0,
    };
  };

  const stats = calculateTotalStats();

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 px-4">
      {/* Header Section */}
      <div className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 transition-all hover:bg-white/[0.04] hover:border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              {t('analytics.pulseEngine')}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              {t('analytics.enterpriseAnalytics')}
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-2xl leading-relaxed">
              {t('analytics.heroDescription')}
            </p>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row gap-4 p-2 bg-slate-950/40 border border-white/5 rounded-[32px] shadow-inner">
            <div className="relative group/date">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none group-hover/date:text-purple-400 transition-colors">
                {t('analytics.from')}
              </span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="pl-14 pr-6 py-3 bg-transparent text-white text-xs font-bold focus:outline-none transition-all cursor-pointer"
              />
            </div>
            <div className="w-px h-8 bg-white/5 self-center hidden sm:block"></div>
            <div className="relative group/date">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none group-hover/date:text-purple-400 transition-colors">
                {t('analytics.to')}
              </span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="pl-10 pr-6 py-3 bg-transparent text-white text-xs font-bold focus:outline-none transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {metricsData.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[32px] p-6 flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
            <Icon name="AlertTriangle" size={20} />
          </div>
          <p className="text-red-400 font-bold text-sm">
            {t('analytics.criticalError', { error: metricsData.error })}
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
        <StatCard
          title={t('analytics.totalEvaluations')}
          value={metricsData.usageMetrics
            .reduce((sum, m) => sum + m.total_evaluations, 0)
            .toLocaleString()}
          subtext={t('analytics.totalSystemCalls')}
          icon="Activity"
          color="blue"
          t={t}
        />
        <StatCard
          title={t('analytics.enabledPercentage')}
          value={`${stats.enabledPercentage}%`}
          subtext={t('analytics.flagSuccessRatio')}
          icon="Check"
          color="emerald"
          t={t}
        />
        <StatCard
          title={t('analytics.avgLatency')}
          value={`${stats.avgResponseTime}ms`}
          subtext={t('analytics.executionTime')}
          icon="Zap"
          color="amber"
          t={t}
        />
        <StatCard
          title={t('analytics.errorRate')}
          value={`${stats.errorRate}%`}
          subtext={t('analytics.stabilityMetric')}
          icon="AlertTriangle"
          color="red"
          t={t}
        />
      </div>

      {/* Loading State */}
      {metricsData.loading && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-24 text-center group">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500/10 border-t-purple-500 border-l-purple-500 animate-spin mx-auto mb-6"></div>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
            {t('analytics.syncingTelemetry')}
          </p>
        </div>
      )}

      {/* Metrics Table */}
      {!metricsData.loading && metricsData.usageMetrics.length > 0 && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl transition-all hover:bg-white/[0.03] animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <div className="px-10 py-8 border-b border-white/5 bg-slate-950/20 flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {t('analytics.usageTemporalWindow')}
            </h2>
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {t('analytics.latestEntries', { count: 20 })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950/20">
                  <th className="pl-10 pr-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    {t('analytics.metricWindow')}
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    {t('analytics.totalEvals')}
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    {t('analytics.enabled')}
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    {t('analytics.disabled')}
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    {t('analytics.errors')}
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    {t('analytics.latency')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {metricsData.usageMetrics.slice(0, 20).map((metric, index) => (
                  <tr
                    key={index}
                    className="group/row hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="pl-10 pr-6 py-6 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover/row:bg-purple-500/10 group-hover/row:text-purple-400 transition-colors shadow-inner">
                          <Icon name="Calendar" size={14} />
                        </div>
                        <span className="font-bold text-slate-300 group-hover/row:text-white transition-colors capitalize">
                          {new Date(metric.metric_date).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm font-mono font-bold text-slate-400">
                      {metric.total_evaluations.toLocaleString()}
                    </td>
                    <td className="px-6 py-6 text-sm">
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold text-[11px] shadow-sm">
                        {metric.enabled_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-sm font-bold text-slate-600">
                      {metric.disabled_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-6 text-sm">
                      <span
                        className={`font-bold ${metric.error_count > 0 ? "text-red-400" : "text-slate-700"}`}
                      >
                        {metric.error_count}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-400">
                          {metric.avg_evaluation_time_ms.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">
                          ms
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!metricsData.loading && metricsData.usageMetrics.length === 0 && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-dashed border-white/10 rounded-[40px] p-24 text-center group">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Icon name="Activity" size={32} className="text-slate-600" />
          </div>
          <p className="text-white font-extrabold text-xl mb-3 tracking-tight">
            {t('analytics.noTelemetry')}
          </p>
          <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
            {t('analytics.noTelemetryDesc')}
          </p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: string;
  color: "blue" | "emerald" | "amber" | "red" | "purple";
  t: (key: string, params?: any) => string;
}

function StatCard({ title, value, subtext, icon, color, t }: StatCardProps) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
    emerald:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    red: "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5",
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 group shadow-lg">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
            {title}
          </h3>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:text-cyan-400 transition-colors">
            {value}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-500 ${colorMap[color]}`}
        >
          <Icon name={icon as any} size={22} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          {subtext}
        </p>
      </div>
    </div>
  );
}
