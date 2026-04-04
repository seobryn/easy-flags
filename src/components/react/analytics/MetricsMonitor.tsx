import React, { useState, useEffect } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

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

import { Icon } from "@/components/react/shared/Icon";

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
        // Get the current space ID from URL or pass it as a prop
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
        
        // Transform flat metrics array into the expected structure
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
    <div className="px-4 py-8 md:p-8 w-full max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="mb-10 text-center md:text-left relative">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/10 blur-[100px] rounded-full"></div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          {t('metrics.title').split(" Dashboard")[0]} <span className="text-gradient">{t('metrics.title').includes("Dashboard") ? "Dashboard" : "Tablero"}</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto md:mx-0">
          {t('metrics.description')}
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2 sm:gap-3 mb-10 pb-2 overflow-x-auto no-scrollbar">
        {timeRangeOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setTimeRange(option.key)}
            className={`shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:base font-semibold transition-all duration-300 border ${
              timeRange === option.key
                ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/25"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="sm:hidden">{option.short}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        <SummaryCard
          title={t('metrics.totalEvaluations')}
          value={totalEvaluations.toLocaleString(initialLocale || "en-US")}
          icon={<Icon name="Activity" size={20} />}
          color="cyan"
        />
        <SummaryCard
          title={t('metrics.spacesMonitored')}
          value={metrics.length.toString()}
          icon={<Icon name="Layers" size={20} />}
          color="blue"
        />
        <SummaryCard
          title={t('metrics.errorRate')}
          value={`${(totalErrors / Math.max(totalEvaluations, 1)).toFixed(2)}%`}
          icon={<Icon name="AlertCircle" size={20} />}
          color={totalErrors > 0 ? "red" : "green"}
        />
        <SummaryCard
          title={t('metrics.avgResponseTime')}
          value={`${avgResponseTime}ms`}
          icon={<Icon name="Clock" size={20} />}
          color="purple"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl p-6 mb-8 flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="text-red-500"><Icon name="AlertCircle" size={20} /></div>
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">{t('metrics.fetching')}</p>
        </div>
      )}

      {/* Metrics by Space */}
      {!loading && metrics.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6 px-1">{t('metrics.monitoredSpaces')}</h2>
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
      )}

      {/* Empty State */}
      {!loading && metrics.length === 0 && !error && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-12 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-500">
             <Icon name="Activity" size={20} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('metrics.noData')}</h3>
          <p className="text-slate-400 mb-8">
            {t('metrics.noDataDesc')}
          </p>
          <a href="/docs" className="btn-primary">{t('metrics.learnHowToIntegrate')}</a>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color: "cyan" | "blue" | "green" | "red" | "purple";
}

function SummaryCard({ title, value, icon, trend, color }: SummaryCardProps) {
  const colorMap = {
    cyan: "from-cyan-400 to-cyan-600 shadow-cyan-500/20",
    blue: "from-blue-400 to-blue-600 shadow-blue-500/20",
    green: "from-emerald-400 to-emerald-600 shadow-emerald-500/20",
    red: "from-rose-400 to-rose-600 shadow-rose-500/20",
    purple: "from-purple-400 to-purple-600 shadow-purple-500/20",
  };

  return (
    <div className="card p-6! group relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-linear-to-br ${colorMap[color]} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full`}></div>
      
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-xl bg-linear-to-br ${colorMap[color]} shadow-lg text-white`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/10">
            <span>↑</span>
            {trend}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
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
      className={`card p-0! overflow-hidden transition-all duration-500 group ${
        isSelected ? "ring-2 ring-cyan-500/50" : ""
      }`}
    >
      <div 
        className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
        onClick={onSelect}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              {space.spaceName}
            </h3>
          </div>
          <p className="text-slate-400 font-medium flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            {t('metrics.activeFeatureFlags', { count: space.flagCount })}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-center gap-8 md:gap-12">
          <MetricItem label={t('metrics.evaluations')} value={space.totalEvaluations.toLocaleString(initialLocale || "en-US")} />
          <MetricItem label={t('metrics.users')} value={space.uniqueUsers.toLocaleString(initialLocale || "en-US")} />
          <MetricItem label={t('metrics.latency')} value={`${space.averageEvaluationTime.toFixed(1)}ms`} />
          <MetricItem 
            label={t('metrics.errors')} 
            value={`${space.errorRate.toFixed(2)}%`} 
            highlight={space.errorRate > 0} 
          />
          
          <div className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-slate-400 transition-all duration-300 ${
            isSelected ? "rotate-180 bg-cyan-500/20 text-cyan-400" : "group-hover:bg-white/10 group-hover:text-white"
          }`}>
            <Icon name="ChevronDown" size={20} />
          </div>
        </div>
      </div>

      {/* Expanded Content: Top Flags */}
      <div className={`transition-all duration-500 ease-in-out border-t border-white/5 bg-black/20 ${
        isSelected ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      }`}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-white">{t('metrics.topPerformingFlags')}</h4>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('metrics.usageDistribution')}</span>
          </div>

          {space.topFlags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {space.topFlags.map((flag) => (
                <div key={flag.key} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded ring-1 ring-cyan-500/20">{flag.key}</p>
                    <p className="text-xs font-bold text-slate-500">
                      {flag.evaluations.toLocaleString(initialLocale || "en-US")} {t('metrics.evaluations').toLowerCase()}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <ProgressItem 
                      label={t('metrics.enabled')} 
                      percentage={(flag.enabled / flag.evaluations) * 100} 
                      color="bg-emerald-500" 
                    />
                    <ProgressItem 
                      label={t('metrics.disabled')} 
                      percentage={(flag.disabled / flag.evaluations) * 100} 
                      color="bg-slate-500" 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-500">{t('metrics.detailsNotAvailable')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-bold tracking-tight ${highlight ? "text-rose-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function ProgressItem({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
        <span>{label}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden" title={`${percentage.toFixed(1)}%`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
