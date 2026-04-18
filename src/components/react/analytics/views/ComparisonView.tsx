import React, { useState, useEffect } from "react";
import type { AnalyticsFilters } from "../AnalyticsManager";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface ComparisonMetrics {
  evaluations: { current: number; previous: number; change: number };
  errorRate: { current: number; previous: number; change: number };
  responseTime: { current: number; previous: number; change: number };
  criticalEvents: { current: number; previous: number; change: number };
  failedOperations: { current: number; previous: number; change: number };
  avgActiveUsers: { current: number; previous: number; change: number };
}

interface ComparisonViewProps {
  filters: AnalyticsFilters;
  initialLocale?: AvailableLanguages;
}

const MetricCard: React.FC<{
  title: string;
  current: number;
  previous: number;
  change: number;
  unit: string;
  format?: (n: number) => string;
  t: (key: string) => string;
}> = ({ title, current, previous, change, unit, format = (n) => n.toString(), t }) => {
  const isPositive = change >= 0;
  const isGoodChange =
    title.toLowerCase().includes("error") || title.toLowerCase().includes("failed") ? !isPositive : isPositive;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h4 className="text-slate-400 text-sm mb-3">{title}</h4>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-slate-500">{t('analytics.currentPeriod')}</p>
          <p className="text-2xl font-bold text-white">
            {format(current)}{unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('analytics.previousPeriod')}</p>
          <p className="text-lg text-slate-400">
            {format(previous)}{unit}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 p-2 rounded ${
            isGoodChange
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">
            {isPositive ? "+" : ""}{change.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ComparisonView({ filters, initialLocale }: ComparisonViewProps) {
  const t = useTranslate(initialLocale);
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonType, setComparisonType] = useState<
    "week_over_week" | "month_over_month" | "quarter_over_quarter"
  >("month_over_month");

  useEffect(() => {
    fetchComparisonData();
  }, [filters, comparisonType]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate,
        comparisonType,
        ...(filters.spaceId && { spaceId: filters.spaceId }),
      });

      const response = await fetch(`/api/analytics/comparison?${params}`);
      if (!response.ok) throw new Error(t('analytics.failedFetchComparison'));

      const data = await response.json();
      setMetrics(data.metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          {t('analytics.loadingComparison')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{t('analytics.periodComparison')}</h2>
        <div className="flex gap-2">
          {(
            [
              "week_over_week",
              "month_over_month",
              "quarter_over_quarter",
            ] as const
          ).map((type) => (
            <button
              key={type}
              onClick={() => setComparisonType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonType === type
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {t(`analytics.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      {metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title={t('analytics.totalEvaluations')}
            current={metrics.evaluations.current}
            previous={metrics.evaluations.previous}
            change={metrics.evaluations.change}
            unit=""
            format={(n) => n.toLocaleString()}
            t={t}
          />
          <MetricCard
            title={t('analytics.errorRateLabel')}
            current={metrics.errorRate.current}
            previous={metrics.errorRate.previous}
            change={metrics.errorRate.change}
            unit="%"
            format={(n) => n.toFixed(2)}
            t={t}
          />
          <MetricCard
            title={t('analytics.avgResponseTime')}
            current={metrics.responseTime.current}
            previous={metrics.responseTime.previous}
            change={metrics.responseTime.change}
            unit="ms"
            format={(n) => n.toFixed(2)}
            t={t}
          />
          <MetricCard
            title={t('analytics.critical')}
            current={metrics.criticalEvents.current}
            previous={metrics.criticalEvents.previous}
            change={metrics.criticalEvents.change}
            unit=""
            format={(n) => n.toLocaleString()}
            t={t}
          />
          <MetricCard
            title={t('analytics.failedLabel')}
            current={metrics.failedOperations.current}
            previous={metrics.failedOperations.previous}
            change={metrics.failedOperations.change}
            unit=""
            format={(n) => n.toLocaleString()}
            t={t}
          />
          <MetricCard
            title={t('analytics.avgActiveUsers')}
            current={metrics.avgActiveUsers.current}
            previous={metrics.avgActiveUsers.previous}
            change={metrics.avgActiveUsers.change}
            unit=""
            format={(n) => n.toLocaleString()}
            t={t}
          />
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <p className="text-slate-400">{t('analytics.noComparisonData')}</p>
        </div>
      )}

      {/* Insights */}
      {metrics && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.keyInsights')}</h3>
          <div className="space-y-3 text-slate-300 text-sm">
            {metrics.evaluations.change > 10 && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded border border-green-500/30">
                <span className="text-green-400 font-bold">+</span>
                <p>
                  {t('analytics.evaluationsIncreased', { percent: metrics.evaluations.change.toFixed(1) })}
                </p>
              </div>
            )}

            {metrics.errorRate.change > 5 && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded border border-red-500/30">
                <span className="text-red-400 font-bold">⚠</span>
                <p>
                  {t('analytics.errorRateIncreased', { percent: metrics.errorRate.change.toFixed(1) })}
                </p>
              </div>
            )}

            {metrics.responseTime.change > 10 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded border border-yellow-500/30">
                <span className="text-yellow-400 font-bold">📊</span>
                <p>
                  {t('analytics.responseTimeIncreased', { percent: metrics.responseTime.change.toFixed(1) })}
                </p>
              </div>
            )}

            {metrics.criticalEvents.current > metrics.criticalEvents.previous * 1.5 && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded border border-red-500/30">
                <span className="text-red-400 font-bold">🚨</span>
                <p>
                  {t('analytics.criticalEventsSurge')}
                </p>
              </div>
            )}

            {metrics.responseTime.change < -10 && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded border border-green-500/30">
                <span className="text-green-400 font-bold">✓</span>
                <p>
                  {t('analytics.responseTimeImproved', { percent: Math.abs(metrics.responseTime.change).toFixed(1) })}
                </p>
              </div>
            )}

            {metrics.errorRate.change < -5 && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded border border-green-500/30">
                <span className="text-green-400 font-bold">✓</span>
                <p>
                  {t('analytics.errorRateDecreased', { percent: Math.abs(metrics.errorRate.change).toFixed(1) })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
