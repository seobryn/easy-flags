import React, { useState, useEffect } from "react";
import type { AnalyticsFilters } from "../AnalyticsManager";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface FlagMetric {
  flagId: string;
  flagName: string;
  environment: string;
  totalEvaluations: number;
  enabledCount: number;
  disabledCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastUpdated: string;
}

interface FlagMetricsViewProps {
  filters: AnalyticsFilters;
  userId: string;
  initialLocale?: AvailableLanguages;
}

export default function FlagMetricsView({
  filters,
  userId,
  initialLocale,
}: FlagMetricsViewProps) {
  const t = useTranslate(initialLocale);
  const [metrics, setMetrics] = useState<FlagMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "evaluations" | "errors" | "responseTime"
  >("evaluations");
  const [viewType, setViewType] = useState<"table" | "cards">("table");

  useEffect(() => {
    fetchMetrics();
  }, [filters, userId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate,
        ...(filters.spaceId && { spaceId: filters.spaceId }),
      });

      const response = await fetch(`/api/analytics/metrics?${params}`);
      if (!response.ok) throw new Error(t('analytics.failedFetchMetrics'));

      const data = await response.json();
      const sortedData = sortMetrics(data || [], sortBy);
      setMetrics(sortedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const sortMetrics = (data: FlagMetric[], sortKey: string) => {
    return [...data].sort((a, b) => {
      switch (sortKey) {
        case "evaluations":
          return b.totalEvaluations - a.totalEvaluations;
        case "errors":
          return b.errorCount - a.errorCount;
        case "responseTime":
          return b.averageResponseTime - a.averageResponseTime;
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setMetrics(sortMetrics(metrics, newSort));
  };

  const calculateStats = () => {
    if (metrics.length === 0)
      return {
        totalEvaluations: 0,
        avgErrorRate: 0,
        avgResponseTime: 0,
        topFlag: null,
      };

    const totalEvals = metrics.reduce((sum, m) => sum + m.totalEvaluations, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) /
      metrics.length;
    const errorRate = totalEvals > 0 ? (totalErrors / totalEvals) * 100 : 0;
    const topFlag = metrics[0];

    return {
      totalEvaluations: totalEvals,
      avgErrorRate: errorRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      topFlag,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          {t('analytics.loadingMetrics')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t('analytics.totalEvaluations')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.totalEvaluations.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t('analytics.errorRateLabel')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.avgErrorRate}%
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t('analytics.avgResponseTime')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.avgResponseTime}ms
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t('analytics.activeFlagsLabel')}</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.length}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleSortChange("evaluations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "evaluations"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {t('analytics.sortByEvaluations')}
          </button>
          <button
            onClick={() => handleSortChange("errors")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "errors"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {t('analytics.sortByErrors')}
          </button>
          <button
            onClick={() => handleSortChange("responseTime")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "responseTime"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {t('analytics.sortByResponse')}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewType("table")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === "table"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {t('analytics.tableView')}
          </button>
          <button
            onClick={() => setViewType("cards")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === "cards"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {t('analytics.cardsView')}
          </button>
        </div>
      </div>

      {/* Metrics Display */}
      {metrics.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
          <p className="text-slate-400 mb-2">{t('analytics.noMetricsAvailable')}</p>
          <p className="text-slate-500 text-sm">
            {t('analytics.startEvaluating')}
          </p>
        </div>
      ) : viewType === "table" ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                  {t('analytics.flagName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                  {t('analytics.environment')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300">
                  {t('analytics.evaluations')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300">
                  {t('analytics.enabledDisabled')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300">
                  {t('analytics.errorsLabel')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300">
                  {t('analytics.avgResponse')}
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => (
                <tr
                  key={metric.flagId}
                  className={`border-b border-slate-700 ${
                    idx % 2 === 0 ? "bg-slate-800/50" : "bg-slate-800/70"
                  } hover:bg-slate-800 transition-colors`}
                >
                  <td className="px-6 py-4 text-white font-medium">
                    {metric.flagName}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{metric.environment}</td>
                  <td className="px-6 py-4 text-right text-blue-400 font-semibold">
                    {metric.totalEvaluations.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    <span className="text-green-400">{metric.enabledCount}</span>/
                    <span className="text-red-400">{metric.disabledCount}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {metric.errorCount > 0 ? (
                      <span className="text-red-400 font-semibold">
                        {metric.errorCount}
                      </span>
                    ) : (
                      <span className="text-green-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    {metric.averageResponseTime.toFixed(2)}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.flagId}
              className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                {metric.flagName}
              </h3>
              <p className="text-slate-400 text-sm mb-4">{metric.environment}</p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">{t('analytics.evaluations')}:</span>
                  <span className="text-blue-400 font-semibold">
                    {metric.totalEvaluations.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">{t('analytics.enabledLabel')}:</span>
                  <span className="text-green-400">
                    {metric.enabledCount} (
                    {((metric.enabledCount / metric.totalEvaluations) * 100).toFixed(
                      1
                    )}
                    %)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">{t('analytics.disabledLabel')}:</span>
                  <span className="text-red-400">
                    {metric.disabledCount} (
                    {((metric.disabledCount / metric.totalEvaluations) * 100).toFixed(
                      1
                    )}
                    %)
                  </span>
                </div>
                {metric.errorCount > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">{t('analytics.errorsLabel')}:</span>
                    <span className="text-red-500 font-semibold">
                      {metric.errorCount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-slate-400 text-sm">{t('analytics.avgResponse')}:</span>
                  <span className="text-slate-300">
                    {metric.averageResponseTime.toFixed(2)}ms
                  </span>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                {t('analytics.updatedAt', { date: new Date(metric.lastUpdated).toLocaleDateString() })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
