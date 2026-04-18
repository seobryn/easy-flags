import React, { useState, useEffect } from "react";
import type { AnalyticsFilters } from "../AnalyticsManager";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface PerformanceData {
  timestamp: string;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  successRate: number;
  cacheHitRate: number;
}

interface EnvironmentPerformance {
  environmentId: string;
  environmentName: string;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  lastUpdated: string;
}

interface PerformanceMetricsViewProps {
  filters: AnalyticsFilters;
  userId: string;
  initialLocale?: AvailableLanguages;
}

export default function PerformanceMetricsView({
  filters,
  userId,
  initialLocale,
}: PerformanceMetricsViewProps) {
  const t = useTranslate(initialLocale);
  const [envMetrics, setEnvMetrics] = useState<EnvironmentPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"overview" | "timeseries">("overview");

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [filters, userId]);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate,
        ...(filters.spaceId && { spaceId: filters.spaceId }),
      });

      const response = await fetch(`/api/analytics/performance?${params}`);
      if (!response.ok) throw new Error(t('analytics.failedFetchPerformance'));

      const data = await response.json();
      setEnvMetrics(data.environments || []);
      setTimeSeriesData(data.timeSeries || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregateMetrics = () => {
    if (envMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        totalRequests: 0,
        avgErrorRate: 0,
        bestEnvironment: null,
        worstEnvironment: null,
      };
    }

    const totalRequests = envMetrics.reduce((sum, e) => sum + e.requestCount, 0);
    const avgResponseTime =
      envMetrics.reduce((sum, e) => sum + e.avgResponseTime * e.requestCount, 0) /
      totalRequests;
    const avgErrorRate =
      envMetrics.reduce((sum, e) => sum + e.errorRate * e.requestCount, 0) /
      totalRequests;

    const bestEnvironment = envMetrics.reduce((best, current) =>
      current.errorRate < best.errorRate ? current : best
    );

    const worstEnvironment = envMetrics.reduce((worst, current) =>
      current.errorRate > worst.errorRate ? current : worst
    );

    return {
      avgResponseTime,
      totalRequests,
      avgErrorRate,
      bestEnvironment,
      worstEnvironment,
    };
  };

  const aggregateMetrics = calculateAggregateMetrics();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          {t('analytics.loadingPerformance')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">{t('analytics.avgResponseTime')}</p>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {aggregateMetrics.avgResponseTime.toFixed(2)}ms
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">{t('analytics.totalRequests')}</p>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {aggregateMetrics.totalRequests.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">{t('analytics.avgErrorRate')}</p>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {aggregateMetrics.avgErrorRate.toFixed(2)}%
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">{t('analytics.environments')}</p>
          <p className="text-2xl font-bold text-white">{envMetrics.length}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* View Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewType("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewType === "overview"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          {t('analytics.envOverview')}
        </button>
        <button
          onClick={() => setViewType("timeseries")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewType === "timeseries"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          {t('analytics.timeSeries')}
        </button>
      </div>

      {/* Environment Performance Overview */}
      {viewType === "overview" ? (
        <>
          {envMetrics.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
              <p className="text-slate-400 mb-2">{t('analytics.noPerformanceData')}</p>
              <p className="text-slate-500 text-sm">
                {t('analytics.performanceMetricsDesc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {envMetrics.map((env) => (
                <div
                  key={env.environmentId}
                  className="bg-slate-800 rounded-lg border border-slate-700 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {env.environmentName}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        env.errorRate < 1
                          ? "bg-green-500/20 text-green-300"
                          : env.errorRate < 5
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {t('analytics.errorsPercent', { count: env.errorRate.toFixed(2) })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs text-slate-400 mb-1">{t('analytics.avgResponse')}</p>
                      <p className="text-lg font-bold text-white">
                        {env.avgResponseTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs text-slate-400 mb-1">{t('analytics.maxResponse')}</p>
                      <p className="text-lg font-bold text-white">
                        {env.maxResponseTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs text-slate-400 mb-1">{t('analytics.minResponse')}</p>
                      <p className="text-lg font-bold text-white">
                        {env.minResponseTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs text-slate-400 mb-1">{t('analytics.totalRequests')}</p>
                      <p className="text-lg font-bold text-white">
                        {env.requestCount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    {t('analytics.lastUpdated', { date: new Date(env.lastUpdated).toLocaleString() })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Time Series Data */}
          {timeSeriesData.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
              <p className="text-slate-400 mb-2">{t('analytics.noTimeSeries')}</p>
              <p className="text-slate-500 text-sm">
                {t('analytics.tryLongerRange')}
              </p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                      {t('analytics.timestamp')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      {t('analytics.avgResponse')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      P50
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      P95
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      P99
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      {t('analytics.rps')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      {t('analytics.errorRate')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                      {t('analytics.cacheHits')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeSeriesData.map((data, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-700 ${
                        idx % 2 === 0 ? "bg-slate-800/50" : "bg-slate-800/70"
                      } hover:bg-slate-800 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(data.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-400 font-semibold">
                        {data.averageResponseTime.toFixed(2)}ms
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {data.p50ResponseTime.toFixed(2)}ms
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {data.p95ResponseTime.toFixed(2)}ms
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {data.p99ResponseTime.toFixed(2)}ms
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        {data.requestsPerSecond.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {data.errorRate > 0 ? (
                          <span className="text-red-400 font-semibold">
                            {data.errorRate.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-green-400">0%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {(data.cacheHitRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
