import { useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { Icon } from "@/components/react/shared/Icon";
import { useLocalizedPath } from "@/infrastructure/i18n/context";

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
  const l = useLocalizedPath();
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

  const [features, setFeatures] = useState<{scheduling: boolean, targeting: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showSaveNotification, setShowSaveNotification] = useState(false);

  useState(() => {
    const fetchFeatures = async () => {
      if (!spaceId) return;
      try {
        const response = await fetch(`/api/spaces/${spaceId}/limits`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setFeatures(data.features);
        }
      } catch (error) {
        console.error("Failed to fetch features:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatures();
  });

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
        <div className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 md:p-14 transition-all hover:bg-white/[0.04] hover:border-white/20 shadow-3xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[2px] bg-linear-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[28px] bg-linear-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                  <Icon name="Settings" size={32} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    CORE ENGINE
                  </div>
                  <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">
                    Advanced <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Rules</span>
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-3xl p-5 min-w-[160px] hover:bg-white/[0.05] transition-colors shadow-inner">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                    Feature Flag
                  </p>
                  <p className="text-base font-bold text-cyan-400 truncate max-w-[180px]">
                    {featureName}
                  </p>
                  <p className="text-[9px] text-slate-600 font-black mt-1 font-mono tracking-tighter uppercase">
                    {featureKey}
                  </p>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-3xl p-5 min-w-[120px] hover:bg-white/[0.05] transition-colors shadow-inner">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                    Schema Type
                  </p>
                  <p className="text-base font-bold text-purple-400 capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
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
            <section className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 md:p-12 transition-all duration-500 hover:bg-white/[0.04] hover:border-cyan-500/20 shadow-3xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full -mr-40 -mt-40 transition-opacity opacity-0 group-hover:opacity-100"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-14">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Icon name="Activity" size={26} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">
                      Rollout Strategy
                    </h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                      Gradual Traffic Exposure Control
                    </p>
                  </div>
                </div>

                <div className="space-y-14">
                  <div className="space-y-8">
                    <div className="flex items-end justify-between px-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                        Traffic Amplitude
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-6xl font-black text-white tracking-tighter transition-all">
                          {rolloutPercentage}
                        </span>
                        <span className="text-cyan-500 text-2xl font-black uppercase tracking-widest">%</span>
                      </div>
                    </div>

                    <div className="relative h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner">
                      <div
                        className="absolute top-1 left-1 bottom-1 bg-linear-to-r from-cyan-600 via-cyan-400 to-blue-500 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-1000 cubic-bezier(0.19, 1, 0.22, 1)"
                        style={{ width: `calc(${rolloutPercentage}% - 8px)` }}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 transition-all hover:bg-white/[0.04]">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 leading-none">
                          System Mode
                        </p>
                        <p
                          className={`text-sm font-black uppercase tracking-widest ${rolloutPercentage === 100 ? "text-cyan-400" : rolloutPercentage > 0 ? "text-amber-400" : "text-slate-700"}`}
                        >
                          {rolloutPercentage === 100
                            ? "GLOBAL DEPLOY"
                            : rolloutPercentage > 0
                              ? "GRADUAL RELEASE"
                              : "SYSTEM STANDBY"}
                        </p>
                      </div>
                      <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 transition-all hover:bg-white/[0.04]">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 leading-none">
                          In-Scope Base
                        </p>
                        <p className="text-sm font-black text-purple-500 uppercase tracking-widest">
                          {rolloutPercentage}% Population
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-8 px-1">
                      PROJECTION TIMELINE
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 ml-2 uppercase tracking-widest">
                          RELEASE START
                        </label>
                        <div className="relative group/input">
                           <Icon name="Calendar" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input
                             type="date"
                             value={rolloutStartDate}
                             onChange={(e) => setRolloutStartDate(e.target.value)}
                             className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all focus:border-cyan-500/40 font-bold shadow-inner"
                           />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 ml-2 uppercase tracking-widest">
                          RELEASE END
                        </label>
                        <div className="relative group/input">
                           <Icon name="Calendar" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input
                             type="date"
                             value={rolloutEndDate}
                             onChange={(e) => setRolloutEndDate(e.target.value)}
                             className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all focus:border-cyan-500/40 font-bold shadow-inner"
                           />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Targeting Rules */}
            <section className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 md:p-12 transition-all duration-500 hover:bg-white/[0.04] hover:border-purple-500/20 shadow-3xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[100px] rounded-full -mr-40 -mt-40 transition-opacity opacity-0 group-hover:opacity-100"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-14">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <Icon name="Target" size={26} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">
                        Targeting Logic {!features?.targeting && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full ml-3 border border-purple-500/20">PRO</span>}
                      </h3>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                        {features?.targeting 
                          ? "Define precise segments for exclusion or inclusion"
                          : "Target specific users or domains with premium rules"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] px-5 py-2 rounded-full border border-white/10 shadow-inner">
                    <span className="text-[10px] font-black text-purple-400 tracking-widest uppercase">
                      ACTIVE RULES: {targetingRules.length}
                    </span>
                  </div>
                </div>

                {!features?.targeting ? (
                  <div className="bg-purple-500/[0.03] border border-purple-500/10 rounded-[32px] p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden group/lock">
                    <div className="absolute inset-0 bg-linear-to-b from-transparent to-purple-500/[0.02]"></div>
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-purple-500/40 relative z-10 group-hover/lock:scale-110 transition-transform duration-500">
                      <Icon name="Lock" size={32} />
                    </div>
                    <div className="relative z-10">
                      <p className="text-white font-extrabold text-lg mb-2">Targeting rules are locked</p>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Upgrade your workspace to the Basic or Pro plan to use advanced segment-based targeting engine.</p>
                    </div>
                    <a href={l("/billing")} className="relative z-10 btn-secondary text-[10px] px-8! py-3.5! font-black uppercase tracking-widest bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-400">View Comparison</a>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-14">
                      {targetingRules.length === 0 ? (
                        <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[32px] py-16 text-center group-hover:bg-white/[0.02] transition-colors">
                          <p className="text-slate-600 text-sm font-bold uppercase tracking-widest italic">
                            No active segment filters.
                          </p>
                        </div>
                      ) : (
                        targetingRules.map((rule, idx) => (
                           <div
                            key={rule.id}
                            className="group/rule flex items-center gap-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 hover:bg-white/[0.06] hover:border-purple-500/40 transition-all duration-300 shadow-inner"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-950/60 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-inner">
                              {(idx + 1).toString().padStart(2, '0')}
                            </div>
                            <div className="flex-1 flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 px-3 py-1.5 rounded-xl border border-purple-500/20 uppercase tracking-widest">
                                {getRuleTypeLabel(rule.type)}
                              </span>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                                {getOperatorLabel(rule.operator)}
                              </span>
                              <span className="text-xs font-mono font-bold text-white bg-slate-950/80 px-4 py-2 rounded-xl border border-white/10 shadow-2xl tracking-tighter">
                                "{rule.value}"
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveRule(rule.id)}
                              className="opacity-0 group-hover/rule:opacity-100 w-10 h-10 rounded-xl bg-red-500/5 text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shadow-inner"
                            >
                              <Icon name="Trash" size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bg-white/[0.01] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-10 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.02] blur-3xl"></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-1">
                        APPEND LOGIC MODULE
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-600 ml-2 uppercase tracking-widest">
                            ATTRIBUTE
                          </label>
                          <select
                            value={newRuleType}
                            onChange={(e) =>
                              setNewRuleType(
                                e.target.value as TargetingRule["type"],
                              )
                            }
                            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/10 transition-all appearance-none cursor-pointer hover:bg-slate-950/60"
                          >
                            <option value="email_domain">Email Domain</option>
                            <option value="user_id">User ID</option>
                            <option value="user_segment">User Segment</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-600 ml-2 uppercase tracking-widest">
                            OPERATOR
                          </label>
                          <select
                            value={newRuleOperator}
                            onChange={(e) =>
                              setNewRuleOperator(
                                e.target.value as TargetingRule["operator"],
                              )
                            }
                            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/10 transition-all appearance-none cursor-pointer hover:bg-slate-950/60"
                          >
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater_than">Greater than</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-600 ml-2 uppercase tracking-widest">
                            VALUE
                          </label>
                          <input
                            type="text"
                            value={newRuleValue}
                            onChange={(e) => setNewRuleValue(e.target.value)}
                            placeholder="e.g. enterprise.com"
                            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-bold placeholder-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner hover:bg-slate-950/60"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAddRule}
                        className="w-full py-4.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-[20px] text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 shadow-2xl relative z-10"
                      >
                        <Icon name="PlusCircle" size={18} />
                        Append Segment Rule
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Config */}
          <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-right-10 duration-1000">
            {/* Default Value */}
            <section className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 shadow-3xl relative overflow-hidden group">
               <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Icon name="Settings" size={24} />
                </div>
                <h4 className="text-lg font-extrabold text-white tracking-tight">
                  Fallback State
                </h4>
              </div>

              <div className="relative z-10">
                {featureType === "boolean" ? (
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/60 rounded-[22px] border border-white/10 shadow-inner">
                    <button
                      onClick={() => setDefaultValue("false")}
                      className={`py-4 rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                        defaultValue === "false"
                          ? "bg-red-500/20 border border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      LOCAL OFF
                    </button>
                    <button
                      onClick={() => setDefaultValue("true")}
                      className={`py-4 rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                        defaultValue === "true"
                          ? "bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      LOCAL ON
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                      STATIC CONSTANT VALUE
                    </p>
                    {featureType === "string" ? (
                      <input
                        type="text"
                        value={defaultValue}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold shadow-inner focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder-slate-700 hover:bg-slate-950/80"
                      />
                    ) : (
                      <textarea
                        value={defaultValue}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-[24px] px-5 py-5 text-white text-xs font-mono h-48 resize-none outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner leading-relaxed hover:bg-slate-950/80"
                      />
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Scheduling */}
            <section className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Icon name="Clock" size={24} />
                  </div>
                  <h4 className="text-lg font-extrabold text-white tracking-tight">
                    Timeline
                  </h4>
                </div>
                <div
                  onClick={() => {
                    if (features?.scheduling) {
                      setSchedulingEnabled(!schedulingEnabled);
                    }
                  }}
                  className={`w-14 h-7 rounded-full border border-white/10 relative transition-all duration-500 ${!features?.scheduling ? "bg-slate-800 cursor-not-allowed grayscale" : "cursor-pointer"} ${schedulingEnabled ? "bg-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5"}`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${schedulingEnabled ? "right-1 bg-white shadow-xl scale-110" : "left-1 bg-slate-700"}`}
                  ></div>
                </div>
              </div>

              {!features?.scheduling ? (
                <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-[28px] p-6 text-center group/prem relative z-10">
                   <p className="text-amber-500/80 font-black text-[9px] uppercase tracking-[0.25em] mb-2 leading-none">PREMIUM MODULE</p>
                   <p className="text-slate-500 text-[10px] mb-4 leading-relaxed font-bold">Automated deployment scheduling is currently locked.</p>
<a href={l("/billing")} className="inline-flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-all group-hover/prem:gap-3">
                      Upgrade Plan <Icon name="ArrowRight" size={10} />
                    </a>
                </div>
              ) : schedulingEnabled ? (
                <div className="space-y-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500 relative z-10">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">
                        AUTO-RELEASE START
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="date"
                          value={scheduleStartDate}
                          onChange={(e) => setScheduleStartDate(e.target.value)}
                          className="flex-1 bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-[11px] text-white outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold hover:bg-slate-950/80"
                        />
                        <input
                          type="time"
                          value={scheduleStartTime}
                          onChange={(e) => setScheduleStartTime(e.target.value)}
                          className="w-24 bg-slate-950/60 border border-white/10 rounded-2xl px-3 py-3 text-[11px] text-white outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold hover:bg-slate-950/80"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">
                        AUTO-RELEASE END
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="date"
                          value={scheduleEndDate}
                          onChange={(e) => setScheduleEndDate(e.target.value)}
                          className="flex-1 bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-[11px] text-white outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold hover:bg-slate-950/80"
                        />
                        <input
                          type="time"
                          value={scheduleEndTime}
                          onChange={(e) => setScheduleEndTime(e.target.value)}
                          className="w-24 bg-slate-950/60 border border-white/10 rounded-2xl px-3 py-3 text-[11px] text-white outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold hover:bg-slate-950/80"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/[0.01] rounded-[28px] border border-white/5 p-6 relative z-10">
                  <p className="text-xs text-slate-600 font-bold leading-relaxed uppercase tracking-tighter italic">
                    Manual sync mode active. Configuration will be deployed
                    immediately upon publication.
                  </p>
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="space-y-5 pt-8">
              <button
                onClick={handleSaveConfiguration}
                className="w-full py-6 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_60px_-10px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 group/btn border border-white/20"
              >
                <Icon name="Save" size={20} className="group-hover/btn:rotate-12 transition-transform" />
                Commit to Edge
              </button>
              <a
                href={l(`/spaces/${spaceId}/features`)}
                className="w-full py-4 text-center text-slate-600 hover:text-white font-black text-[10px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 group/link"
              >
                <Icon
                  name="X"
                  size={14}
                  className="group-hover/link:rotate-90 transition-transform duration-300"
                />
                Discard Configuration
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
