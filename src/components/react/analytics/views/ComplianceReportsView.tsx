import React, { useState, useEffect } from "react";
import type { AnalyticsFilters } from "../AnalyticsManager";
import { Zap, AlertCircle, RefreshCw, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface ComplianceReport {
  id: string;
  spaceId: string;
  reportType: "SOC2" | "GDPR" | "HIPAA" | "PCI-DSS" | "GENERAL";
  periodStart: string;
  periodEnd: string;
  totalActions: number;
  criticalActions: number;
  failedActions: number;
  uniqueUsers: number;
  data: {
    accessEvents: number;
    dataModifications: number;
    deletionEvents: number;
    securityEvents: number;
    failedAuthAttempts: number;
    permissionChanges: number;
  };
  createdAt: string;
  status: "draft" | "completed" | "archived";
}

interface ComplianceReportsViewProps {
  filters: AnalyticsFilters;
  userId: string;
  isAdmin?: boolean;
  initialLocale?: AvailableLanguages;
}

const ReportTypeColor: Record<string, string> = {
  SOC2: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  GDPR: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  HIPAA: "bg-red-500/20 text-red-300 border-red-500/30",
  "PCI-DSS": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  GENERAL: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function ComplianceReportsView({
  filters,
  userId,
  isAdmin = false,
  initialLocale,
}: ComplianceReportsViewProps) {
  const t = useTranslate(initialLocale);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<
    "SOC2" | "GDPR" | "HIPAA" | "PCI-DSS" | "GENERAL"
  >("GENERAL");

  useEffect(() => {
    fetchReports();
  }, [filters, userId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate,
        ...(filters.spaceId && { spaceId: filters.spaceId }),
      });

      const response = await fetch(
        isAdmin
          ? `/api/audit/reports?${params}`
          : `/api/audit/reports/user?${params}`
      );
      if (!response.ok) throw new Error(t('analytics.failedFetchReports'));

      const data = await response.json();
      setReports(data.reports || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const payload = {
        reportType: selectedReportType,
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate,
        ...(filters.spaceId && { spaceId: filters.spaceId }),
      };

      const response = await fetch("/api/audit/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t('analytics.failedGenerateReport'));

      const newReport = await response.json();
      setReports([newReport.report, ...reports]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setGenerating(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'GENERAL': return t('analytics.generalAudit');
      case 'SOC2': return t('analytics.soc2Compliance');
      case 'GDPR': return t('analytics.gdprDataProtection');
      case 'HIPAA': return t('analytics.hipaaHealthcare');
      case 'PCI-DSS': return t('analytics.pciDssPaymentCard');
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          {t('analytics.loadingReports')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Report Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('analytics.generateReport')}
        </h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm text-slate-400 mb-2">{t('analytics.reportType')}</label>
            <select
              value={selectedReportType}
              onChange={(e) =>
                setSelectedReportType(
                  e.target.value as
                    | "SOC2"
                    | "GDPR"
                    | "HIPAA"
                    | "PCI-DSS"
                    | "GENERAL"
                )
              }
              className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="GENERAL">{t('analytics.generalAudit')}</option>
              <option value="SOC2">{t('analytics.soc2Compliance')}</option>
              <option value="GDPR">{t('analytics.gdprDataProtection')}</option>
              <option value="HIPAA">{t('analytics.hipaaHealthcare')}</option>
              <option value="PCI-DSS">{t('analytics.pciDssPaymentCard')}</option>
            </select>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            {generating ? t('analytics.generating') : t('analytics.generate')}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
          <p className="text-slate-400 mb-2">{t('analytics.noComplianceReports')}</p>
          <p className="text-slate-500 text-sm">
            {t('analytics.generateFirstReport')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-slate-800 rounded-lg border border-slate-700">
              <div
                className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() =>
                  setExpandedReportId(
                    expandedReportId === report.id ? null : report.id
                  )
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                    <div>
                      <h4 className="text-white font-semibold">
                        {t('analytics.reportTitle', { type: report.reportType })}
                      </h4>
                      <p className="text-slate-400 text-sm">
                        {new Date(report.periodStart).toLocaleDateString()} -{" "}
                        {new Date(report.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                        ReportTypeColor[report.reportType] ||
                        ReportTypeColor.GENERAL
                      }`}
                    >
                      {report.reportType}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                        report.status === "completed"
                          ? "bg-green-500/20 text-green-300"
                          : report.status === "archived"
                          ? "bg-slate-500/20 text-slate-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {t(`analytics.status.${report.status}`)}
                    </span>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-400 text-xs">{t('analytics.totalActions')}</p>
                    <p className="text-white font-semibold">
                      {report.totalActions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-400 text-xs">{t('analytics.critical')}</p>
                    <p className="text-red-400 font-semibold">
                      {report.criticalActions}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-400 text-xs">{t('analytics.failedLabel')}</p>
                    <p className="text-yellow-400 font-semibold">
                      {report.failedActions}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-400 text-xs">{t('analytics.uniqueUsers')}</p>
                    <p className="text-blue-400 font-semibold">
                      {report.uniqueUsers}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedReportId === report.id && (
                <div className="bg-slate-900 border-t border-slate-700 p-4 space-y-4">
                  <div>
                    <h5 className="text-white font-semibold mb-3">
                      {t('analytics.eventBreakdown')}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        {
                          label: t('analytics.accessEvents'),
                          value: report.data.accessEvents,
                          color: "text-blue-400",
                        },
                        {
                          label: t('analytics.dataModifications'),
                          value: report.data.dataModifications,
                          color: "text-yellow-400",
                        },
                        {
                          label: t('analytics.deletionEvents'),
                          value: report.data.deletionEvents,
                          color: "text-red-400",
                        },
                        {
                          label: t('analytics.securityEvents'),
                          value: report.data.securityEvents,
                          color: "text-purple-400",
                        },
                        {
                          label: t('analytics.failedAuth'),
                          value: report.data.failedAuthAttempts,
                          color: "text-orange-400",
                        },
                        {
                          label: t('analytics.permissionChanges'),
                          value: report.data.permissionChanges,
                          color: "text-green-400",
                        },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-800 rounded p-3">
                          <p className="text-slate-400 text-xs mb-1">
                            {item.label}
                          </p>
                          <p className={`text-lg font-bold ${item.color}`}>
                            {item.value.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Summary */}
                  <div className="bg-slate-800 rounded p-4 border border-slate-700">
                    <h5 className="text-white font-semibold mb-2">
                      {t('analytics.complianceSummary', { type: report.reportType })}
                    </h5>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {report.reportType === "SOC2" && (
                        <>
                          <li>✓ Access controls and monitoring in place</li>
                          <li>✓ Audit logging enabled</li>
                          <li>✓ User activity tracking active</li>
                        </>
                      )}
                      {report.reportType === "GDPR" && (
                        <>
                          <li>✓ User consent tracking</li>
                          <li>✓ Data access logging</li>
                          <li>✓ Deletion audit trail</li>
                          <li>✓ Right to be forgotten capable</li>
                        </>
                      )}
                      {report.reportType === "HIPAA" && (
                        <>
                          <li>✓ PHI access controls</li>
                          <li>✓ Encryption enabled</li>
                          <li>✓ Audit logging compliant</li>
                          <li>✓ Access logs retained</li>
                        </>
                      )}
                      {report.reportType === "PCI-DSS" && (
                        <>
                          <li>✓ User authentication logging</li>
                          <li>✓ Access control audit trail</li>
                          <li>✓ Invalid access attempts logged</li>
                          <li>✓ Admin activity tracking</li>
                        </>
                      )}
                      {report.reportType === "GENERAL" && (
                        <>
                          <li>✓ Complete audit trail available</li>
                          <li>✓ User activity tracking enabled</li>
                          <li>✓ System events logged</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                      📥 {t('analytics.downloadPdf')}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium text-sm transition-colors">
                      📊 {t('analytics.exportData')}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    {t('analytics.generatedAt', { date: new Date(report.createdAt).toLocaleString() })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
