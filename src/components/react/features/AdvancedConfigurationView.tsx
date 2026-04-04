import { useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { Icon } from "@/components/react/shared/Icon";

interface TargetingRule {
  id: string;
  type: "email_domain" | "user_id" | "user_segment" | "percentage";
  value: string;
  operator: "equals" | "contains" | "greater_than";
}

interface AdvancedConfigViewProps {
  spaceId: string | undefined;
  spaceName: string;
  featureId: string | undefined;
  featureName: string;
  featureKey: string;
  featureType: "boolean" | "string" | "json";
}

export default function AdvancedConfigurationView({
  spaceId,
  spaceName,
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
      spaceName={spaceName}
      currentTab="features"
      subPage={{ name: featureName, path: `/spaces/${spaceId}/features` }}
    >
      <div className="animate-in fade-in duration-1000 space-y-12">
        {/* Header Hero */}
        <div className="relative group overflow-hidden bg-[#0b0e14]/40 border border-white/5 rounded-4xl p-8 md:p-12 transition-all hover:border-white/10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-cyan-500/15 transition-colors duration-700"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-2xl">
                  <Icon name="Settings" size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-1">
                    Configuration Engine
                  </p>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    Advanced Rules
                  </h1>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 min-w-[140px] hover:bg-white/5 transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Feature
                  </p>
                  <p className="text-sm font-bold text-cyan-400 truncate max-w-[150px]">
                    {featureName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                    {featureKey}
                  </p>
                </div>
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 min-w-[100px] hover:bg-white/5 transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Type
                  </p>
                  <p className="text-sm font-bold text-purple-400 capitalize">
                    {featureType}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {showSaveNotification && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 flex items-center gap-3 animate-in slide-in-from-top-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Icon name="Check" size={16} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">
              Configuration synced to edge successfully
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Controls */}
          <div className="lg:col-span-8 space-y-8">
            {/* Rollout Configuration */}
            <section className="bg-white/3 border border-white/5 rounded-4xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <Icon name="Activity" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Rollout Strategy
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Control exposure across your user base
                    </p>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Traffic Percentage
                      </p>
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {rolloutPercentage}
                        <span className="text-cyan-500 text-2xl">%</span>
                      </span>
                    </div>

                    <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="absolute top-0 left-0 h-full bg-linear-to-r from-cyan-600 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-500"
                        style={{ width: `${rolloutPercentage}%` }}
                      ></div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={rolloutPercentage}
                        onChange={(e) =>
                          setRolloutPercentage(parseInt(e.target.value, 10))
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Status
                        </p>
                        <p
                          className={`text-xs font-black uppercase ${rolloutPercentage === 100 ? "text-cyan-400" : rolloutPercentage > 0 ? "text-amber-400" : "text-slate-500"}`}
                        >
                          {rolloutPercentage === 100
                            ? "Global"
                            : rolloutPercentage > 0
                              ? "Gradual"
                              : "Off"}
                        </p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Exposure
                        </p>
                        <p className="text-xs font-black text-purple-400 uppercase">
                          {rolloutPercentage}% Population
                        </p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Engine
                        </p>
                        <p className="text-xs font-black text-emerald-400 uppercase">
                          Sticky-Hash
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                      Transition Timeline
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">
                          START DATE
                        </label>
                        <input
                          type="date"
                          value={rolloutStartDate}
                          onChange={(e) => setRolloutStartDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 outline-hidden transition-all focus:border-cyan-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">
                          END DATE
                        </label>
                        <input
                          type="date"
                          value={rolloutEndDate}
                          onChange={(e) => setRolloutEndDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 outline-hidden transition-all focus:border-cyan-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Targeting Rules */}
            <section className="bg-white/3 border border-white/5 rounded-4xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                      <Icon name="Target" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Targeting Logic
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Define precise segments for exclusion or inclusion
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10!">
                    <span className="text-[10px] font-black text-purple-400">
                      RULES: {targetingRules.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  {targetingRules.length === 0 ? (
                    <div className="bg-black/20 border border-dashed border-white/10 rounded-2xl py-12 text-center">
                      <p className="text-slate-600 text-sm italic font-medium">
                        No targeting rules defined. Feature matches all users by
                        default.
                      </p>
                    </div>
                  ) : (
                    targetingRules.map((rule, idx) => (
                      <div
                        key={rule.id}
                        className="group/rule flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-purple-500/30 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {idx + 1}
                        </div>
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md">
                            {getRuleTypeLabel(rule.type)}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {getOperatorLabel(rule.operator)}
                          </span>
                          <span className="text-xs font-mono font-bold text-white bg-black/40 px-3 py-1 rounded-md border border-white/5">
                            "{rule.value}"
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveRule(rule.id)}
                          className="opacity-0 group-hover/rule:opacity-100 w-8 h-8 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex items-center justify-center"
                        >
                          <Icon name="Trash" size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Craft New Segment Rule
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-600 ml-1 uppercase">
                        Attribute
                      </label>
                      <select
                        value={newRuleType}
                        onChange={(e) =>
                          setNewRuleType(
                            e.target.value as TargetingRule["type"],
                          )
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
                      >
                        <option value="email_domain">Email Domain</option>
                        <option value="user_id">User ID</option>
                        <option value="user_segment">User Segment</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-600 ml-1 uppercase">
                        Operator
                      </label>
                      <select
                        value={newRuleOperator}
                        onChange={(e) =>
                          setNewRuleOperator(
                            e.target.value as TargetingRule["operator"],
                          )
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater than</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-600 ml-1 uppercase">
                        Value
                      </label>
                      <input
                        type="text"
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                        placeholder="e.g. enterprise.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder-slate-600 outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddRule}
                    className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Icon name="PlusCircle" size={16} />
                    Append Targeting Rule
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Config */}
          <div className="lg:col-span-4 space-y-8">
            {/* Default Value */}
            <section className="bg-linear-to-br from-[#0b0e14] to-black border border-white/5 rounded-4xl p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Icon name="Settings" size={20} />
                </div>
                <h4 className="font-bold text-white tracking-tight">
                  Fallback State
                </h4>
              </div>

              {featureType === "boolean" ? (
                <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setDefaultValue("false")}
                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                      defaultValue === "false"
                        ? "bg-red-500/20 border border-red-500/30 text-red-400 shadow-2xl"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => setDefaultValue("true")}
                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                      defaultValue === "true"
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-2xl"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    ON
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Static Constant
                  </p>
                  {featureType === "string" ? (
                    <input
                      type="text"
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                    />
                  ) : (
                    <textarea
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono h-32 resize-none outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                    />
                  )}
                </div>
              )}
            </section>

            {/* Scheduling */}
            <section className="bg-linear-to-br from-[#0b0e14] to-black border border-white/5 rounded-4xl p-8 group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Icon name="Clock" size={20} />
                  </div>
                  <h4 className="font-bold text-white tracking-tight">
                    Timeline
                  </h4>
                </div>
                <div
                  onClick={() => setSchedulingEnabled(!schedulingEnabled)}
                  className={`w-12 h-6 rounded-full border border-white/10 relative cursor-pointer transition-all ${schedulingEnabled ? "bg-amber-500/40" : "bg-white/5"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full transition-all ${schedulingEnabled ? "right-1 bg-white shadow-2xl" : "left-1 bg-slate-700"}`}
                  ></div>
                </div>
              </div>

              {schedulingEnabled ? (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-600 uppercase">
                        START
                      </p>
                      <input
                        type="date"
                        value={scheduleStartDate}
                        onChange={(e) => setScheduleStartDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-600 uppercase">
                        TIME
                      </p>
                      <input
                        type="time"
                        value={scheduleStartTime}
                        onChange={(e) => setScheduleStartTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-600 uppercase">
                        END
                      </p>
                      <input
                        type="date"
                        value={scheduleEndDate}
                        onChange={(e) => setScheduleEndDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-600 uppercase">
                        TIME
                      </p>
                      <input
                        type="time"
                        value={scheduleEndTime}
                        onChange={(e) => setScheduleEndTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  System ignore scheduling. Configuration will be deployed
                  immediately upon sync.
                </p>
              )}
            </section>

            {/* Actions */}
            <div className="space-y-4 pt-4">
              <button
                onClick={handleSaveConfiguration}
                className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Icon name="Save" size={18} strokeWidth={2.5} />
                Deploy changes
              </button>
              <a
                href={`/spaces/${spaceId}/features`}
                className="w-full py-4 text-center text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
              >
                <Icon
                  name="X"
                  size={14}
                  className="group-hover:rotate-90 transition-transform"
                />
                Discard session
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
