export interface CalloutProps {
  type: "tip" | "note" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
}

const calloutStyles = {
  tip: {
    container: "bg-emerald-500/10 border-l-4 border-emerald-500",
    header: "text-emerald-300",
    icon: "💡",
  },
  note: {
    container: "bg-blue-500/10 border-l-4 border-blue-500",
    header: "text-blue-300",
    icon: "📝",
  },
  warning: {
    container: "bg-amber-500/10 border-l-4 border-amber-500",
    header: "text-amber-300",
    icon: "⚠️",
  },
  info: {
    container: "bg-cyan-500/10 border-l-4 border-cyan-500",
    header: "text-cyan-300",
    icon: "ℹ️",
  },
};

export default function Callout({ type, title, children }: CalloutProps) {
  const style = calloutStyles[type];

  return (
    <div className={`${style.container} rounded-r-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{style.icon}</span>
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold ${style.header} mb-1`}>{title}</h4>
          )}
          <div className="text-slate-300 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
