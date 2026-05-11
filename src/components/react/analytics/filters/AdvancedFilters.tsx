import React from "react";
import type { AnalyticsFilters } from "../AnalyticsManager";
import { Icon } from "../../shared/Icon";

interface AdvancedFiltersProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
}

const AUDIT_ACTIONS = [
  "SPACE_CREATED",
  "SPACE_UPDATED",
  "SPACE_DELETED",
  "ENVIRONMENT_CREATED",
  "ENVIRONMENT_UPDATED",
  "ENVIRONMENT_DELETED",
  "FEATURE_CREATED",
  "FEATURE_UPDATED",
  "FEATURE_DELETED",
  "FLAG_ENABLED",
  "FLAG_DISABLED",
  "PERMISSION_CHANGED",
  "PERMISSION_DENIED",
  "API_KEY_CREATED",
  "API_KEY_REVOKED",
  "SETTINGS_CHANGED",
  "FAILED_LOGIN",
  "SUCCESSFUL_LOGIN",
];

export default function AdvancedFilters({
  filters,
  onChange,
}: AdvancedFiltersProps) {
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      dateRange: {
        startDate: e.target.value,
        endDate: filters.dateRange.endDate,
      },
    });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      dateRange: {
        startDate: filters.dateRange.startDate,
        endDate: e.target.value,
      },
    });
  };

  const handleSpaceIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      spaceId: e.target.value || undefined,
    });
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      userId: e.target.value || undefined,
    });
  };

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      actionType: e.target.value || undefined,
    });
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filters,
      severity: !value ? undefined : (value as "info" | "warning" | "critical"),
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filters,
      status: !value ? undefined : (value as "success" | "failed"),
    });
  };

  const handleReset = () => {
    onChange({
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      },
      spaceId: undefined,
      userId: undefined,
      actionType: undefined,
      severity: undefined,
      status: undefined,
    });
  };

  const activeFilterCount = [
    filters.spaceId,
    filters.userId,
    filters.actionType,
    filters.severity,
    filters.status,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Advanced Filters</h3>
        {activeFilterCount > 0 && (
           <button
             onClick={handleReset}
             className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-medium transition-colors"
           >
             <Icon name="X" size={16} />
             Reset Filters ({activeFilterCount})
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">From Date</label>
          <input
            type="date"
            value={filters.dateRange.startDate}
            onChange={handleDateFromChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">To Date</label>
          <input
            type="date"
            value={filters.dateRange.endDate}
            onChange={handleDateToChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Space ID */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Space ID</label>
          <input
            type="text"
            placeholder="Filter by space..."
            value={filters.spaceId || ""}
            onChange={handleSpaceIdChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* User ID */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">User ID</label>
          <input
            type="text"
            placeholder="Filter by user..."
            value={filters.userId || ""}
            onChange={handleUserIdChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Action Type</label>
          <select
            value={filters.actionType || ""}
            onChange={handleActionTypeChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Actions</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Severity</label>
          <select
            value={filters.severity || ""}
            onChange={handleSeverityChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Status</label>
          <select
            value={filters.status || ""}
            onChange={handleStatusChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
