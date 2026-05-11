import React from "react";
import { Icon } from "../shared/Icon";

interface BillingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string;
  icon?: string;
  prefix?: React.ReactNode;
}

export const BillingInput: React.FC<BillingInputProps> = ({ 
  label, 
  icon, 
  prefix, 
  className = "", 
  ...props 
}) => {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
        {label}
      </label>
      <div className="relative">
        {prefix ? (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
            {prefix}
          </div>
        ) : icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon name={icon as any} size={16} />
          </div>
        )}
        <input
          {...props}
          className={`w-full ${prefix ? "pl-32" : icon ? "pl-12" : "px-5"} pr-5 py-3.5 bg-slate-950/40 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner ${className}`}
        />
      </div>
    </div>
  );
};
