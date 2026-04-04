import { Icon, type IconName } from "./Icon";

export interface CalloutProps {
  type: "tip" | "note" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
}

const iconMap: Record<CalloutProps["type"], IconName> = {
  tip: "Lightbulb",
  note: "FileText",
  warning: "AlertTriangle",
  info: "Info",
};

const calloutStyles = {
  tip: {
    container: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
    glow: "bg-emerald-500/20",
  },
  note: {
    container: "bg-blue-500/5 border-blue-500/20 text-blue-400",
    glow: "bg-blue-500/20",
  },
  warning: {
    container: "bg-amber-500/5 border-amber-500/20 text-amber-400",
    glow: "bg-amber-500/20",
  },
  info: {
    container: "bg-cyan-500/5 border-cyan-500/20 text-cyan-400",
    glow: "bg-cyan-500/20",
  },
};

export default function Callout({ type, title, children }: CalloutProps) {
  const style = calloutStyles[type];

  return (
    <div
      className={`${style.container} border rounded-2xl p-6 mb-8 relative overflow-hidden group`}
    >
      <div
        className={`absolute -left-10 -top-10 w-24 h-24 ${style.glow} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
      ></div>

      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-2 rounded-lg bg-white/5 shrink-0`}>
          <Icon name={iconMap[type]} size={18} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-bold text-white mb-2 text-base tracking-tight">
              {title}
            </h4>
          )}
          <div className="text-slate-400 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
