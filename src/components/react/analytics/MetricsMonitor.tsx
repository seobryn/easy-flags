import React, { useState, useEffect } from "react";

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

export default function MetricsMonitor({ userId }: MetricsMonitorProps) {
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
          throw new Error("Failed to fetch metrics");
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
          space.errorRate = metric.error_count > 0 ? ((metric.error_count / metric.total_evaluations) * 100) : 0;
        });
        
        setMetrics(Array.from(spacesMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
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

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Metrics Dashboard</h1>
        <p className="text-slate-400">Monitor your feature flags performance across all spaces</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-8">
        {(["24h", "7d", "30d"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Last {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : "30 Days"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Evaluations"
          value={totalEvaluations.toLocaleString()}
          icon="📊"
          trend={"+12%"}
          color="blue"
        />
        <SummaryCard
          title="Spaces Monitored"
          value={metrics.length.toString()}
          icon="✅"
          color="green"
        />
        <SummaryCard
          title="Error Rate"
          value={`${(totalErrors / Math.max(totalEvaluations, 1)).toFixed(2)}%`}
          icon="⚠️"
          color={totalErrors > 0 ? "red" : "green"}
        />
        <SummaryCard
          title="Avg Response Time"
          value={`${avgResponseTime}ms`}
          icon="⏱️"
          color="purple"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-slate-400">Loading metrics...</div>
        </div>
      )}

      {/* Metrics by Space */}
      {!loading && metrics.length > 0 && (
        <div className="space-y-6">
          {metrics.map((space) => (
            <SpaceMetricsCard
              key={space.spaceId}
              space={space}
              isSelected={selectedSpace === space.spaceId}
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No metrics data available yet.</p>
          <p className="text-slate-500 text-sm mt-2">
            Start evaluating feature flags to see metrics here.
          </p>
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
  color: "blue" | "green" | "red" | "purple";
}

function SummaryCard({ title, value, icon, trend, color }: SummaryCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 border-blue-500",
    green: "bg-green-500/10 border-green-500",
    red: "bg-red-500/10 border-red-500",
    purple: "bg-purple-500/10 border-purple-500",
  };

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        {trend && <span className="text-green-400 text-sm font-medium">{trend}</span>}
      </div>
      <p className="text-slate-400 text-sm mb-2">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

interface SpaceMetricsCardProps {
  space: MetricsData;
  isSelected: boolean;
  onSelect: () => void;
}

function SpaceMetricsCard({ space, isSelected, onSelect }: SpaceMetricsCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={onSelect}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{space.spaceName}</h3>
          <p className="text-slate-400 text-sm">{space.flagCount} feature flags</p>
        </div>
        <div className={`text-xl transition-transform ${
            isSelected ? "rotate-180" : ""
          }`}>
          ↗️
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-slate-400 text-sm">Total Evaluations</p>
          <p className="text-lg font-semibold text-white">
            {space.totalEvaluations.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Unique Users</p>
          <p className="text-lg font-semibold text-white">
            {space.uniqueUsers.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Avg Response Time</p>
          <p className="text-lg font-semibold text-white">
            {space.averageEvaluationTime.toFixed(2)}ms
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Error Rate</p>
          <p className={`text-lg font-semibold ${space.errorRate > 0 ? "text-red-400" : "text-green-400"}`}>
            {space.errorRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Top Flags */}
      {isSelected && space.topFlags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4">Top Flags</h4>
          <div className="space-y-3">
            {space.topFlags.map((flag) => (
              <div key={flag.key} className="bg-slate-700/50 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-mono text-blue-400">{flag.key}</p>
                  <p className="text-xs text-slate-400">
                    {flag.evaluations.toLocaleString()} evals
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Enabled</p>
                    <div className="w-full bg-slate-600 rounded h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded"
                        style={{
                          width: `${(flag.enabled / flag.evaluations) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Disabled</p>
                    <div className="w-full bg-slate-600 rounded h-2 mt-1">
                      <div
                        className="bg-red-500 h-2 rounded"
                        style={{
                          width: `${(flag.disabled / flag.evaluations) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
