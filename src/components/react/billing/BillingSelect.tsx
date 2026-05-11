import React from "react";
import { Icon } from "../shared/Icon";

interface BillingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  loading?: boolean;
  placeholder?: string;
  options: { value: string; label: string; flag?: string }[];
}

export const BillingSelect: React.FC<BillingSelectProps> = ({ 
  label, 
  loading, 
  options, 
  className = "", 
  ...props 
}) => {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          className={`w-full px-5 py-3.5 bg-slate-950/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner appearance-none cursor-pointer disabled:opacity-50 ${className}`}
        >
          {props.placeholder && <option value="">{props.placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0b0e14]">
              {opt.flag} {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          {loading ? (
            <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          ) : (
            <Icon name="ChevronDown" size={16} />
          )}
        </div>
      </div>
    </div>
  );
};
