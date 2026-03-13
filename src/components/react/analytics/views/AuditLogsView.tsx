import React, { useState, useEffect } from "react";
import type { AnalyticsFilters } from "../AnalyticsManager";

interface AuditLog {
  id: string;
  spaceId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  severity: "info" | "warning" | "critical";
  status: "success" | "failed";
  errorMessage?: string;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsViewProps {
  filters: AnalyticsFilters;
  userId: string;
  isAdmin?: boolean;
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors = {
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${
        colors[severity as keyof typeof colors] || colors.info
      }`}
    >
      {severity.toUpperCase()}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${
        status === "success"
          ? "bg-green-500/20 text-green-300 border-green-500/30"
          : "bg-red-500/20 text-red-300 border-red-500/30"
      }`}
    >
      {status === "success" ? "✓ Success" : "✗ Failed"}
    </span>
  );
};

export default function AuditLogsView({
  filters,
  userId,
  isAdmin = false,
}: AuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
    setCurrentPage(0);
  }, [filters, userId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate,
        limit: pageSize.toString(),
        offset: (currentPage * pageSize).toString(),
        ...(filters.spaceId && { spaceId: filters.spaceId }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.actionType && { action: filters.actionType }),
        ...(filters.severity && { severity: filters.severity }),
      });

      const response = await fetch(
        isAdmin
          ? `/api/audit/logs?${params}`
          : `/api/audit/logs/user?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch audit logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalCount(data.count || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          Loading audit logs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400 text-sm">
          Total Audit Entries: <span className="text-white font-semibold">{totalCount.toLocaleString()}</span>
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
          <span className="text-red-400">⚠️</span>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
          <p className="text-slate-400 mb-2">No audit logs found</p>
          <p className="text-slate-500 text-sm">
            Try adjusting your filters or date range
          </p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors ${
                          idx % 2 === 0 ? "bg-slate-800/50" : "bg-slate-800/70"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {log.resourceType}
                          {log.resourceId && (
                            <span className="text-slate-500">
                              {" "}
                              ({log.resourceId.substring(0, 8)}...)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <SeverityBadge severity={log.severity} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setExpandedRowId(
                                expandedRowId === log.id ? null : log.id
                              )
                            }
                            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            <span>👁️</span>
                            <span className={`transition-transform inline-block ${
                                expandedRowId === log.id ? "rotate-180" : ""
                              }`}>▼</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {expandedRowId === log.id && (
                        <tr className="bg-slate-900 border-b border-slate-700">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="space-y-4">
                              {/* Metadata */}
                              {log.metadata && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">
                                    Metadata
                                  </h4>
                                  <pre className="bg-slate-800 rounded p-3 text-xs text-slate-300 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Changes */}
                              {log.changesBefore && log.changesAfter && (
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">
                                    Changes
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Before</p>
                                      <pre className="bg-slate-800 rounded p-3 text-xs text-slate-300 overflow-x-auto">
                                        {JSON.stringify(log.changesBefore, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">After</p>
                                      <pre className="bg-slate-800 rounded p-3 text-xs text-slate-300 overflow-x-auto">
                                        {JSON.stringify(log.changesAfter, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Error Details */}
                              {log.errorMessage && (
                                <div>
                                  <h4 className="text-sm font-semibold text-red-400 mb-2">
                                    Error
                                  </h4>
                                  <p className="text-sm text-slate-300 bg-slate-800 rounded p-3">
                                    {log.errorMessage}
                                  </p>
                                </div>
                              )}

                              {/* Connection Details */}
                              <div className="border-t border-slate-700 pt-4">
                                <p className="text-xs text-slate-400">
                                  IP: <span className="text-slate-300">{log.ipAddress}</span>
                                </p>
                                {log.userAgent && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    User Agent:{" "}
                                    <span className="text-slate-300 break-all">
                                      {log.userAgent}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Page {currentPage + 1} of {Math.max(1, totalPages)} (
              {pageSize} per page)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
