import React, { useState } from "react";
import PageContainer from "./PageContainer";

interface RolloutConfig {
  percentage: number;
  startDate: string;
  endDate: string;
}

interface TargetingRule {
  id: string;
  type: "email_domain" | "user_id" | "user_segment" | "percentage";
  value: string;
  operator: "equals" | "contains" | "greater_than";
}

interface AdvancedConfigViewProps {
  spaceId: string | undefined;
  featureId: string | undefined;
  featureName: string;
  featureKey: string;
  featureType: "boolean" | "string" | "json";
}

export default function AdvancedConfigurationView({
  spaceId,
  featureId,
  featureName,
  featureKey,
  featureType,
}: AdvancedConfigViewProps) {
  // Rollout Configuration
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [rolloutStartDate, setRolloutStartDate] = useState("");
  const [rolloutEndDate, setRolloutEndDate] = useState("");

  // Targeting Rules
  const [targetingRules, setTargetingRules] = useState<TargetingRule[]>([
    {
      id: "1",
      type: "email_domain",
      operator: "contains",
      value: "@company.com",
    },
  ]);

  const [newRuleType, setNewRuleType] =
    useState<TargetingRule["type"]>("email_domain");
  const [newRuleOperator, setNewRuleOperator] =
    useState<TargetingRule["operator"]>("contains");
  const [newRuleValue, setNewRuleValue] = useState("");

  // Default Value
  const [defaultValue, setDefaultValue] = useState(
    featureType === "boolean" ? "false" : "",
  );

  // Scheduling
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("00:00");
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("23:59");

  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const handleAddRule = () => {
    if (!newRuleValue.trim()) return;

    const newRule: TargetingRule = {
      id: Date.now().toString(),
      type: newRuleType,
      operator: newRuleOperator,
      value: newRuleValue,
    };

    setTargetingRules([...targetingRules, newRule]);
    setNewRuleValue("");
  };

  const handleRemoveRule = (id: string) => {
    setTargetingRules(targetingRules.filter((rule) => rule.id !== id));
  };

  const handleSaveConfiguration = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
    console.log("Advanced Configuration Saved:", {
      rollout: {
        percentage: rolloutPercentage,
        startDate: rolloutStartDate,
        endDate: rolloutEndDate,
      },
      targetingRules,
      defaultValue,
      scheduling: {
        enabled: schedulingEnabled,
        startDate: scheduleStartDate,
        startTime: scheduleStartTime,
        endDate: scheduleEndDate,
        endTime: scheduleEndTime,
      },
    });
  };

  const getRuleTypeLabel = (type: TargetingRule["type"]) => {
    const labels: Record<TargetingRule["type"], string> = {
      email_domain: "Email Domain",
      user_id: "User ID",
      user_segment: "User Segment",
      percentage: "Percentage",
    };
    return labels[type];
  };

  const getOperatorLabel = (operator: TargetingRule["operator"]) => {
    const labels: Record<TargetingRule["operator"], string> = {
      equals: "Equals",
      contains: "Contains",
      greater_than: "Greater than",
    };
    return labels[operator];
  };

  return (
    <PageContainer
      spaceId={spaceId}
      spaceName="Acme Corporation"
      currentTab="features"
      subPage={{ name: featureName, path: `/spaces/${spaceId}/features` }}
    >
      {/* Header */}
      <div className="mb-12 mt-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Advanced Configuration
              </h1>
              <p className="text-slate-400">
                Fine-tune your feature rollout with precision targeting and
                scheduling
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">
                  Feature
                </p>
                <p className="text-lg font-bold text-cyan-300 mt-1">
                  {featureName}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {featureKey}
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">
                  Type
                </p>
                <p className="text-lg font-bold text-purple-300 mt-1 capitalize">
                  {featureType}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Notification */}
        {showSaveNotification && (
          <div className="mb-6 bg-green-950/50 border border-green-700/50 rounded-lg p-4 text-green-300 flex items-center gap-3">
            <span className="text-xl">✓</span>
            <span className="font-semibold">Advanced configuration saved</span>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Rollout Configuration Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📊</span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Rollout Configuration
                </h2>
                <p className="text-xs text-slate-400">
                  Gradually roll out this feature to a percentage of users
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-200">
                    Rollout Percentage
                  </label>
                  <span className="text-3xl font-bold text-cyan-400">
                    {rolloutPercentage}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={rolloutPercentage}
                  onChange={(e) =>
                    setRolloutPercentage(parseInt(e.target.value, 10))
                  }
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                />

                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>0% — Nobody</span>
                  <span>50% — Early Access</span>
                  <span>100% — Everyone</span>
                </div>

                {/* Status row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-900/50 rounded p-3 text-center border border-slate-700">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-cyan-300 mt-1">
                      {rolloutPercentage === 100
                        ? "Full"
                        : rolloutPercentage > 0
                          ? "Partial"
                          : "Offline"}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded p-3 text-center border border-slate-700">
                    <p className="text-xs text-slate-400">Users</p>
                    <p className="text-sm font-semibold text-purple-300 mt-1">
                      {rolloutPercentage}%
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded p-3 text-center border border-slate-700">
                    <p className="text-xs text-slate-400">Mode</p>
                    <p className="text-sm font-semibold text-green-300 mt-1">
                      {rolloutPercentage > 0 ? "Active" : "Paused"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <p className="text-sm font-semibold text-slate-300 mb-3">
                  Rollout Timeline
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={rolloutStartDate}
                      onChange={(e) => setRolloutStartDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={rolloutEndDate}
                      onChange={(e) => setRolloutEndDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Targeting Rules Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Targeting Rules
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define which users this feature applies to
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-700 rounded-full text-slate-300 text-xs font-bold">
                {targetingRules.length}
              </span>
            </div>

            <div className="space-y-4">
              {/* Active Rules */}
              {targetingRules.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No targeting rules defined yet
                </p>
              ) : (
                <div className="space-y-2">
                  {targetingRules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="bg-slate-900/50 border border-slate-700 rounded p-3 flex items-center justify-between group/rule"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs font-semibold text-slate-400">
                          {idx + 1}.
                        </span>
                        <p className="text-sm text-slate-300 flex-1">
                          <span className="text-purple-300 font-semibold">
                            {getRuleTypeLabel(rule.type)}
                          </span>{" "}
                          <span className="text-slate-500">
                            {getOperatorLabel(rule.operator)}
                          </span>{" "}
                          <span className="text-cyan-300">"{rule.value}"</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveRule(rule.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition opacity-0 group-hover/rule:opacity-100"
                        title="Remove rule"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Rule */}
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-300">
                  Add New Rule
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={newRuleType}
                    onChange={(e) =>
                      setNewRuleType(e.target.value as TargetingRule["type"])
                    }
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="email_domain">Email Domain</option>
                    <option value="user_id">User ID</option>
                    <option value="user_segment">User Segment</option>
                    <option value="percentage">Percentage</option>
                  </select>

                  <select
                    value={newRuleOperator}
                    onChange={(e) =>
                      setNewRuleOperator(
                        e.target.value as TargetingRule["operator"],
                      )
                    }
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater than</option>
                  </select>

                  <input
                    type="text"
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    placeholder="e.g., @company.com"
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
                <button
                  onClick={handleAddRule}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-semibold transition"
                >
                  + Add Rule
                </button>
              </div>
            </div>
          </div>

          {/* Default Value Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚙️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Default Value</h2>
                <p className="text-xs text-slate-400">
                  Fallback when feature is not explicitly set
                </p>
              </div>
            </div>

            {featureType === "boolean" ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDefaultValue("false")}
                  className={`px-4 py-3 rounded font-semibold transition ${
                    defaultValue === "false"
                      ? "bg-red-600/30 border border-red-500/50 text-red-200"
                      : "bg-slate-700 border border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="text-lg mr-2">
                    {defaultValue === "false" ? "🔴" : "⭕"}
                  </span>
                  OFF
                </button>
                <button
                  onClick={() => setDefaultValue("true")}
                  className={`px-4 py-3 rounded font-semibold transition ${
                    defaultValue === "true"
                      ? "bg-green-600/30 border border-green-500/50 text-green-200"
                      : "bg-slate-700 border border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="text-lg mr-2">
                    {defaultValue === "true" ? "🟢" : "⭕"}
                  </span>
                  ON
                </button>
              </div>
            ) : featureType === "string" ? (
              <input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Enter default value"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              />
            ) : (
              <textarea
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 text-sm font-mono h-24 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              />
            )}
          </div>

          {/* Scheduling Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <h2 className="text-xl font-bold text-white">Scheduling</h2>
                  <p className="text-xs text-slate-400">
                    Set dates and times for automatic activation
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={schedulingEnabled}
                onChange={(e) => setSchedulingEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500"
              />
              <span className="text-sm text-slate-300">
                Enable scheduled rollout
              </span>
            </label>

            {schedulingEnabled && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={scheduleEndDate}
                    onChange={(e) => setScheduleEndDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <a
              href={`/spaces/${spaceId}/features`}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded text-center text-sm font-semibold transition"
            >
              Cancel
            </a>
            <button
              onClick={handleSaveConfiguration}
              className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
            >
              💾 Save Configuration
            </button>
          </div>
        </div>
      </PageContainer>
  );
}
