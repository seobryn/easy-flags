import React, { useState, useEffect } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface AlertManagerProps {
  userId: string;
  initialLocale?: AvailableLanguages;
}

interface Alert {
  metric: string;
  current: number;
  limit: number;
  percentage: number;
  severity: 'warning' | 'critical';
}

interface AlertConfig {
  metricType: string;
  threshold: number;
  alertType: 'email' | 'in_app' | 'both';
  isActive: boolean;
}

const metricTranslationKeys: Record<string, string> = {
  api_calls: 'billing.apiCalls',
  feature_flags: 'billing.featureFlags',
  environments: 'billing.environments',
  team_members: 'billing.teamMembers',
};

const defaultConfigs: AlertConfig[] = [
  { metricType: 'api_calls', threshold: 80, alertType: 'both', isActive: true },
  { metricType: 'feature_flags', threshold: 80, alertType: 'both', isActive: true },
  { metricType: 'environments', threshold: 80, alertType: 'both', isActive: true },
  { metricType: 'team_members', threshold: 80, alertType: 'both', isActive: true },
];

export default function AlertManager({ userId, initialLocale }: AlertManagerProps) {
  const t = useTranslate(initialLocale);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [configurations, setConfigurations] = useState<AlertConfig[]>(defaultConfigs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [alertsRes, configRes] = await Promise.all([
          fetch('/api/alerts/check'),
          fetch('/api/alerts/config'),
        ]);

        if (!alertsRes.ok) {
          throw new Error(t('common.error'));
        }

        const alertsData = await alertsRes.json();
        const alertsList = alertsData.data?.alerts ?? alertsData.alerts ?? [];
        setAlerts(alertsList);

        if (configRes.ok) {
          const configData = await configRes.json();
          setConfigurations(configData.data?.config ?? configData.config ?? defaultConfigs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error'));
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, t]);

  const getMetricLabel = (metric: string) => {
    const key = metricTranslationKeys[metric];
    const translated = key ? t(key) : metric;
    // Fallback if translation returns the key itself
    if (translated === key || translated === metric) {
      const fallbacks: Record<string, string> = {
        api_calls: 'API Calls',
        feature_flags: 'Feature Flags',
        environments: 'Environments',
        team_members: 'Team Members',
      };
      return fallbacks[metric] || metric;
    }
    return translated;
  };

  const getAlertIcon = (metric: string): string => {
    const icons: Record<string, string> = {
      api_calls: 'Zap',
      feature_flags: 'Flag',
      environments: 'Globe',
      team_members: 'Users',
    };
    return icons[metric] || 'AlertTriangle';
  };

  const handleConfigUpdate = async (updatedConfig: AlertConfig) => {
    const newConfigs = configurations.map((c) =>
      c.metricType === updatedConfig.metricType ? updatedConfig : c
    );
    setConfigurations(newConfigs);

    try {
      await fetch('/api/alerts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-slate-400 flex items-center gap-2">
          <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-red-400 flex items-center gap-2">
          <Icon name="AlertCircle" size={20} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              {t('billing.alerts.alertSystem')}
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">
              {t('billing.alerts.monitorUsage')}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl">
              {t('billing.alerts.alertSystemDesc')}
            </p>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-colors shadow-lg min-w-[180px]"
          >
            <Icon name="Settings" size={16} />
            {showSettings ? t('billing.alerts.hideSettings') : t('billing.alerts.configureAlerts')}
          </button>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <h3 className="text-xl font-extrabold text-white mb-6">
            {t('billing.alerts.activeAlerts')}
          </h3>

          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`bg-slate-900/30 border border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all ${
                  alert.severity === 'critical' 
                    ? 'border-red-500/30 bg-red-900/20' 
                    : 'border-amber-500/30 bg-amber-900/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    alert.severity === 'critical' 
                      ? 'bg-red-500/20 border border-red-500/30' 
                      : 'bg-amber-500/20 border border-amber-500/30'
                  }`}>
                    <Icon 
                      name={getAlertIcon(alert.metric) as any} 
                      size={24} 
                      className={alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}
                    />
                  </div>
                  
                  <div>
                    <p className="text-lg font-extrabold text-white mb-1">
                      {getMetricLabel(alert.metric)} {t('billing.alerts.usageHigh')}
                    </p>
                    <p className="text-slate-300 text-sm">
                      {t('billing.alerts.currentUsage')}: {alert.current.toLocaleString()} / {alert.limit.toLocaleString()} 
                      ({alert.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className={`text-right ${alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                  <p className="text-xl font-extrabold">
                    {alert.severity === 'critical' ? t('billing.alerts.critical') : t('billing.alerts.warning')}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {alert.percentage.toFixed(1)}% {t('billing.alerts.used')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-12 text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="Check" size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">
            {t('billing.alerts.noActiveAlerts')}
          </h3>
          <p className="text-slate-400">
            {t('billing.alerts.allMetricsNormal')}
          </p>
        </div>
      )}

      {showSettings && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <h3 className="text-xl font-extrabold text-white mb-6">
            {t('billing.alerts.alertSettings')}
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['api_calls', 'feature_flags', 'environments', 'team_members'].map((metric) => {
                const config = configurations.find(c => c.metricType === metric) || defaultConfigs.find(c => c.metricType === metric)!;

                return (
                  <div key={metric} className="bg-slate-900/30 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        {getMetricLabel(metric)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">
                          {t('billing.alerts.threshold')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={config.threshold}
                            onChange={(e) => 
                              handleConfigUpdate({...config, threshold: Number(e.target.value)})
                            }
                            className="w-16 pl-2 py-1 bg-slate-800 border border-white/20 rounded-lg text-white text-sm font-bold text-center focus:outline-none"
                            min="10"
                            max="99"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`alert-active-${metric}`}
                          checked={config.isActive}
                          onChange={(e) => 
                            handleConfigUpdate({...config, isActive: e.target.checked})
                          }
                          className="w-4 h-4 rounded border border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500"
                        />
                        <label htmlFor={`alert-active-${metric}`} className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {t('billing.alerts.active')}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/20 border border-white/10 rounded-2xl p-4">
              <h4 className="text-sm font-extrabold text-white mb-3">
                {t('billing.alerts.notificationSettings')}
              </h4>
              <p className="text-slate-400 text-sm mb-4">
                {t('billing.alerts.notificationSettingsDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}