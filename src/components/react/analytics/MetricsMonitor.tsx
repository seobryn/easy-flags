import React, { useState, useEffect } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface MetricsData {
  spaceId: string;
  spaceName: string;
  flagCount: number;
  totalEvaluations: number;
  uniqueUsers: number;
  averageEvaluationTime: number;
  errorRate: number;
  topFlags: Array<{
    key: string;
    evaluations: number;
    enabled: number;
    disabled: number;
  }>;
  recentTrend: Array<{
    timestamp: string;
    evaluations: number;
  }>;
}

interface MetricsMonitorProps {
  userId: string | number;
  initialLocale?: AvailableLanguages;
}

// Helper function to get date range based on time range selection
function getDateRange(timeRange: "24h" | "7d" | "30d"): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  
  switch (timeRange) {
    case "24h":
      from.setDate(from.getDate() - 1);
      break;
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
  }
  
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function MetricsMonitor({ userId, initialLocale }: MetricsMonitorProps) {
  const t = useTranslate(initialLocale);
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const spaceId = new URL(window.location.href).searchParams.get("spaceId") || "1";
        
        const params = new URLSearchParams({
          space_id: spaceId,
          metric_type: "usage",
          date_from: getDateRange(timeRange).from,
          date_to: getDateRange(timeRange).to,
        });

        const response = await fetch(`/api/analytics/metrics?${params}`);
        if (!response.ok) {
          throw new Error(t('metrics.fetchError'));
        }
        const rawData = await response.json();
        
        const metricsArray = Array.isArray(rawData) ? rawData : [];
        const spacesMap = new Map<string, MetricsData>();
        
        metricsArray.forEach((metric: any) => {
          const spaceId = metric.space_id || "default";
          if (!spacesMap.has(spaceId)) {
            spacesMap.set(spaceId, {
              spaceId,
              spaceName: `Space ${spaceId}`,
              flagCount: 0,
              totalEvaluations: 0,
              uniqueUsers: 0,
              averageEvaluationTime: 0,
              errorRate: 0,
              topFlags: [],
              recentTrend: [],
            });
          }
          
          const space = spacesMap.get(spaceId)!;
          space.totalEvaluations += metric.total_evaluations || 0;
          space.flagCount += 1;
          space.averageEvaluationTime = metric.avg_evaluation_time_ms || 0;
          space.errorRate = metric.total_evaluations > 0 ? ((metric.error_count || 0) / metric.total_evaluations) * 100 : 0;
        });
        
        setMetrics(Array.from(spacesMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.noResults'));
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [userId, timeRange]);

  const totalEvaluations = metrics.reduce((acc, m) => acc + m.totalEvaluations, 0);
  const totalErrors = metrics.reduce(
    (acc, m) => acc + Math.round(m.totalEvaluations * (m.errorRate / 100)),
    0
  );
  const avgResponseTime =
    metrics.length > 0
      ? Math.round(
          metrics.reduce((acc, m) => acc + m.averageEvaluationTime, 0) /
            metrics.length
        )
      : 0;

  const timeRangeOptions = [
    { key: "24h" as const, label: t('metrics.last24h'), short: "24H" },
    { key: "7d" as const, label: t('metrics.last7d'), short: "7D" },
    { key: "30d" as const, label: t('metrics.last30d'), short: "30D" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-10 animate-in fade-in duration-1000 px-6">
      {/* Header Section */}
      <div className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] p-8 md:p-12 transition-all hover:bg-white/[0.04] hover:border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-cyan-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              {t('metrics.liveTelemetry')}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              {t('metrics.title').includes("Dashboard") || t('metrics.title').includes("Tableau") || t('metrics.title').includes("Tablero") ? (
                <>
                  {t('metrics.title').split(/ Dashboard| Tableau| Tablero/)[0]}{" "}
                  <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {t('metrics.title').match(/Dashboard|Tableau|Tablero/)?.[0]}
                  </span>
                </>
              ) : t('metrics.title')}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium">
              {t('metrics.description')}
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex p-1 bg-slate-950/40 border border-white/5 rounded-full shadow-inner lg:shrink-0 overflow-x-auto no-scrollbar">
            {timeRangeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setTimeRange(option.key)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  timeRange === option.key
                    ? "bg-cyan-500 text-white shadow-[0_10px_20px_rgba(6,182,212,0.3)]"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                <span className="md:hidden">{option.short}</span>
                <span className="hidden md:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-6 duration-1000 delay-200">
        <SummaryCard
          title={t('metrics.totalEvaluations')}
          value={totalEvaluations.toLocaleString(initialLocale || "en-US")}
          icon="Activity"
          color="cyan"
          subtext={t('metrics.totalSystemLoad')}
        />
        <SummaryCard
          title={t('metrics.spacesMonitored')}
          value={metrics.length.toString()}
          icon="Layers"
          color="blue"
          subtext={t('metrics.attachedNamespaces')}
        />
        <SummaryCard
          title={t('metrics.errorRate')}
          value={`${(totalErrors / Math.max(totalEvaluations, 1)).toFixed(2)}%`}
          icon="AlertCircle"
          color={totalErrors > 0 ? "red" : "emerald"}
          subtext={t('metrics.criticalFailures')}
        />
        <SummaryCard
          title={t('metrics.avgResponseTime')}
          value={`${avgResponseTime}ms`}
          icon="Clock"
          color="purple"
          subtext={t('metrics.evaluationLatency')}
        />
      </div>

      {/* Error & Loading States */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[32px] p-8 flex items-center gap-6 animate-in fade-in duration-500">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
            <Icon name="AlertTriangle" size={24} />
          </div>
          <div>
            <p className="text-red-400 font-black text-[10px] uppercase tracking-widest mb-1">{t('metrics.dataFetchFailure')}</p>
            <p className="text-white font-bold">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-24 text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 border-l-cyan-500 rounded-full animate-spin mx-auto mb-8 shadow-inner"></div>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">{t('metrics.fetching')}</p>
        </div>
      )}

      {/* Metrics by Space */}
      {!loading && metrics.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <div className="flex items-center justify-between px-4">
             <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{t('metrics.monitoredSpaces')}</h2>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">{t('metrics.activeNodes', { count: metrics.length })}</span>
          </div>
          <div className="space-y-6">
            {metrics.map((space) => (
              <SpaceMetricsCard
                key={space.spaceId}
                space={space}
                isSelected={selectedSpace === space.spaceId}
                initialLocale={initialLocale}
                onSelect={() =>
                  setSelectedSpace(
                    selectedSpace === space.spaceId ? null : space.spaceId
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && metrics.length === 0 && !error && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-dashed border-white/10 rounded-[32px] p-24 text-center group">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-600 group-hover:scale-110 transition-transform duration-500 shadow-inner">
             <Icon name="Activity" size={32} />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight">{t('metrics.noData')}</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
            {t('metrics.noDataDesc')}
          </p>
          <a href="/docs" className="btn-primary inline-flex items-center gap-3 px-10! py-4!">{t('metrics.learnHowToIntegrate')} <Icon name="ArrowRight" size={16} /></a>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  color: "cyan" | "blue" | "emerald" | "red" | "purple";
  subtext?: string;
}

function SummaryCard({ title, value, icon, trend, color, subtext }: SummaryCardProps) {
  const colorMap = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 group relative overflow-hidden shadow-2xl">
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-500 ${colorMap[color]}`}>
           <Icon name={icon as any} size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/10 tracking-widest">
            <span>↑</span>
            {trend}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-slate-500 text-[9px] font-black mb-2 uppercase tracking-[0.25em]">{title}</h3>
        <p className="text-4xl font-black text-white tracking-tighter mb-2 group-hover:text-cyan-400 transition-colors">{value}</p>
        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{subtext}</p>
      </div>
    </div>
  );
}

interface SpaceMetricsCardProps {
  space: MetricsData;
  isSelected: boolean;
  onSelect: () => void;
  initialLocale?: AvailableLanguages;
}

function SpaceMetricsCard({ space, isSelected, onSelect, initialLocale }: SpaceMetricsCardProps) {
  const t = useTranslate(initialLocale);
  return (
    <div 
      className={`bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden transition-all duration-700 group ${
        isSelected ? "bg-white/[0.05] border-cyan-500/30 shadow-2xl scale-[1.01]" : "hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      <div 
        className="p-8 md:p-10 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8"
        onClick={onSelect}
      >
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className={`w-3 h-3 rounded-full animate-pulse shadow-2xl ${space.errorRate > 5 ? "bg-red-500 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50"}`}></div>
            <h3 className="text-3xl font-extrabold text-white group-hover:text-cyan-400 transition-colors tracking-tight">
              {space.spaceName}
            </h3>
          </div>
          <p className="text-slate-400 font-bold text-sm tracking-tight px-1">
            {t('metrics.activeFeatureFlags', { count: space.flagCount })}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-14">
          <MetricItem label={t('metrics.evaluations')} value={space.totalEvaluations.toLocaleString(initialLocale || "en-US")} />
          <MetricItem label={t('metrics.users')} value={space.uniqueUsers.toLocaleString(initialLocale || "en-US")} />
          <MetricItem label={t('metrics.latency')} value={`${space.averageEvaluationTime.toFixed(1)}ms`} color="purple" />
          <MetricItem 
            label={t('metrics.errors')} 
            value={`${space.errorRate.toFixed(2)}%`} 
            highlight={space.errorRate > 0} 
          />
          
          <div className={`hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-500 transition-all duration-700 ${
            isSelected ? "rotate-180 bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "group-hover:bg-white/10 group-hover:text-white"
          }`}>
            <Icon name="ChevronDown" size={24} />
          </div>
        </div>
      </div>

      {/* Expanded Content: Top Flags */}
      <div className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-t border-white/5 bg-slate-950/20 overflow-hidden ${
        isSelected ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="p-10 md:p-14">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div>
               <h4 className="text-xl font-extrabold text-white tracking-tight mb-2">{t('metrics.topPerformingFlags')}</h4>
               <p className="text-slate-500 text-xs font-medium">{t('metrics.evaluationDistribution')}</p>
            </div>
            <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('metrics.usageDistribution')}</div>
          </div>

          {space.topFlags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {space.topFlags.map((flag) => (
                <div key={flag.key} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all duration-500 shadow-inner group/flag">
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-xs font-mono font-black text-cyan-400 bg-cyan-500/5 px-4 py-2 rounded-xl border border-cyan-500/10 group-hover/flag:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all uppercase tracking-tighter">{flag.key}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       {flag.evaluations.toLocaleString(initialLocale || "en-US")} <span className="text-[9px] opacity-60">REQS</span>
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <ProgressItem 
                      label={t('metrics.enabled')} 
                      value={flag.enabled}
                      total={flag.evaluations}
                      percentage={(flag.enabled / flag.evaluations) * 100} 
                      color="bg-emerald-500" 
                    />
                    <ProgressItem 
                      label={t('metrics.disabled')} 
                      value={flag.disabled}
                      total={flag.evaluations}
                      percentage={(flag.disabled / flag.evaluations) * 100} 
                      color="bg-slate-600" 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
              <Icon name="Search" size={32} className="text-slate-700 mx-auto mb-6" />
              <p className="text-slate-600 font-bold tracking-tight">{t('metrics.detailsNotAvailable')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, highlight = false, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1">{label}</p>
      <p className={`text-2xl font-black tracking-tighter ${highlight ? "text-red-500" : color === 'purple' ? "text-purple-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function ProgressItem({ label, value, total, percentage, color }: { label: string; value: number, total: number, percentage: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-end text-[10px] font-black mb-3 px-1">
        <span className="text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
           <span className="text-white font-mono">{value.toLocaleString()}</span>
           <span className="text-slate-700 opacity-60">/</span>
           <span className="text-slate-600">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${color} shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
