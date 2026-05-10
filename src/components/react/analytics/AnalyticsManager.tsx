import React, { useState, useEffect, useMemo } from "react";
import FlagMetricsView from "./views/FlagMetricsView";
import AuditLogsView from "./views/AuditLogsView";
import PerformanceMetricsView from "./views/PerformanceMetricsView";
import ComplianceReportsView from "./views/ComplianceReportsView";
import ComparisonView from "./views/ComparisonView";
import AdvancedFilters from "./filters/AdvancedFilters";
import { exportToCSV, exportToJSON } from "@lib/analytics-export";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";
import * as Tabs from "@radix-ui/react-tabs";

type TabType = "flags" | "audit" | "performance" | "compliance" | "comparison";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  spaceId?: string;
  userId?: string;
  actionType?: string;
  severity?: "info" | "warning" | "critical";
  status?: "success" | "failed";
}

interface AnalyticsManagerProps {
  userId: string;
  isAdmin?: boolean;
  spaceId?: string;
  initialLocale?: AvailableLanguages;
}

export default function AnalyticsManager({
  userId,
  isAdmin = false,
  spaceId: defaultSpaceId,
  initialLocale,
}: AnalyticsManagerProps) {
  const t = useTranslate(initialLocale);
  const [activeTab, setActiveTab] = useState<string>("flags");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
    spaceId: defaultSpaceId,
  });
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const dateRangeDisplay = useMemo(() => {
    const start = new Date(filters.dateRange.startDate);
    const end = new Date(filters.dateRange.endDate);
    const diffDays = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return t('analytics.today');
    if (diffDays === 1) return t('analytics.lastXDays', { count: 2 });
    if (diffDays === 6) return t('analytics.lastXDays', { count: 7 });
    if (diffDays === 29) return t('analytics.lastXDays', { count: 30 });
    if (diffDays === 89) return t('analytics.lastXDays', { count: 90 });
    return t('analytics.lastXDays', { count: diffDays + 1 });
  }, [filters.dateRange, t]);

  const handleSetDatePreset = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    setFilters((prev) => ({
      ...prev,
      dateRange: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Fetch current view data
      const viewData = await fetchViewData(activeTab);

      if (exportFormat === "csv") {
        exportToCSV(viewData, `${activeTab}-analytics-${Date.now()}.csv`);
      } else {
        exportToJSON(viewData, `${activeTab}-analytics-${Date.now()}.json`);
      }

      setShowExportMenu(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const fetchViewData = async (tab: TabType) => {
    // This will be implemented in each view component
    const response = await fetch("/api/analytics/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tab,
        filters,
      }),
    });
    return response.json();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Icon name="Activity" size={28} />
                {t('analytics.analyticsManager')}
              </h1>
              <p className="text-slate-400">
                {t('analytics.analyticsManagerDesc')}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {/* Quick date presets */}
              <div className="flex gap-2 items-center">
                <Icon name="Calendar" size={16} className="text-slate-400" />
                <span className="text-sm text-slate-300 font-medium">
                  {dateRangeDisplay}
                </span>
              </div>

              {/* Export dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Icon name="ExternalLink" size={16} />
                  {exporting ? t('analytics.exporting') : t('analytics.export')}
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden z-50 shadow-lg">
                    <button
                      onClick={() => {
                        setExportFormat("csv");
                        handleExport();
                      }}
                      className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {t('analytics.exportCSV')}
                    </button>
                    <button
                      onClick={() => {
                        setExportFormat("json");
                        handleExport();
                      }}
                      className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 transition-colors border-t border-slate-700"
                    >
                      {t('analytics.exportJSON')}
                    </button>
                  </div>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFilters
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <span>🔍</span>
                {t('analytics.filters')}
              </button>
            </div>
          </div>

          {/* Quick date presets */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: t('analytics.today'), days: 0 },
              { label: t('analytics.lastXDays', { count: 7 }), days: 7 },
              { label: t('analytics.lastXDays', { count: 30 }), days: 30 },
              { label: t('analytics.lastXDays', { count: 90 }), days: 90 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => handleSetDatePreset(days)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filters.dateRange.startDate ===
                  new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-slate-800/30 border-b border-slate-700 p-6">
          <AdvancedFilters filters={filters} onChange={setFilters} />
        </div>
      )}

{/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="bg-slate-800/20 border-b border-slate-700 p-6">
        <Tabs.List className="flex gap-3 flex-wrap">
          <Tabs.Trigger
            value="flags"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            <Icon name="Activity" size={18} />
            {t('analytics.flagMetrics')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="audit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            <Icon name="FileText" size={18} />
            {t('analytics.auditLogs')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="performance"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            <Icon name="Zap" size={18} />
            {t('analytics.performance')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="compliance"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            <Icon name="Check" size={18} />
            {t('analytics.compliance')}
          </Tabs.Trigger>
          {isAdmin && (
            <Tabs.Trigger
              value="comparison"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              <Icon name="Layers" size={18} />
              {t('analytics.comparisonTab')}
            </Tabs.Trigger>
          )}
        </Tabs.List>

        {/* Content */}
        <Tabs.Content value="flags" className="p-6">
          <FlagMetricsView
            userId={userId}
            filters={filters}
            onFilterChange={setFilters}
            initialLocale={initialLocale}
          />
        </Tabs.Content>
        <Tabs.Content value="audit" className="p-6">
          <AuditLogsView
            userId={userId}
            filters={filters}
            onFilterChange={setFilters}
            initialLocale={initialLocale}
          />
        </Tabs.Content>
        <Tabs.Content value="performance" className="p-6">
          <PerformanceMetricsView
            userId={userId}
            filters={filters}
            onFilterChange={setFilters}
            initialLocale={initialLocale}
          />
        </Tabs.Content>
        <Tabs.Content value="compliance" className="p-6">
          <ComplianceReportsView
            userId={userId}
            filters={filters}
            onFilterChange={setFilters}
            initialLocale={initialLocale}
          />
        </Tabs.Content>
        {isAdmin && (
          <Tabs.Content value="comparison" className="p-6">
            <ComparisonView
              userId={userId}
              filters={filters}
              onFilterChange={setFilters}
              initialLocale={initialLocale}
            />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </div>
  );
}
