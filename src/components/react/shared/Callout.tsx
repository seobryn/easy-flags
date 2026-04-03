import React from "react";

export interface CalloutProps {
  type: "tip" | "note" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
}

const Icons = {
  tip: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  note: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>,
  warning: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  info: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
};

const calloutStyles = {
  tip: {
    container: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
    icon: <Icons.tip />,
    glow: "bg-emerald-500/20"
  },
  note: {
    container: "bg-blue-500/5 border-blue-500/20 text-blue-400",
    icon: <Icons.note />,
    glow: "bg-blue-500/20"
  },
  warning: {
    container: "bg-amber-500/5 border-amber-500/20 text-amber-400",
    icon: <Icons.warning />,
    glow: "bg-amber-500/20"
  },
  info: {
    container: "bg-cyan-500/5 border-cyan-500/20 text-cyan-400",
    icon: <Icons.info />,
    glow: "bg-cyan-500/20"
  },
};

export default function Callout({ type, title, children }: CalloutProps) {
  const style = calloutStyles[type];

  return (
    <div className={`${style.container} border rounded-2xl p-6 mb-8 relative overflow-hidden group`}>
      <div className={`absolute -left-10 -top-10 w-24 h-24 ${style.glow} blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-2 rounded-lg bg-white/5 flex-shrink-0`}>
          {style.icon}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-bold text-white mb-2 text-base tracking-tight">{title}</h4>
          )}
          <div className="text-slate-400 text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
