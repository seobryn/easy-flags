import { useState } from "react";
import type { ColumnInfo } from "./types";
import { Icon } from "../shared/Icon";

interface EditRowModalProps {
  isOpen: boolean;
  selectedTable: string | null;
  schema: ColumnInfo[];
  formData: Record<string, string>;
  loading: boolean;
  onFormChange: (column: string, value: string) => void;
  onEditRow: () => void;
  onClose: () => void;
}

export function EditRowModal({
  isOpen,
  selectedTable,
  schema,
  formData,
  loading,
  onFormChange,
  onEditRow,
  onClose,
}: EditRowModalProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});

  const togglePasswordVisibility = (fieldName: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#06080f]/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#0b0e14]/95 border border-white/10 rounded-4xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header Highlight - centered and faded at edges */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-linear-to-r from-transparent via-blue-500/50 to-transparent"></div>
        
        <div className="shrink-0 p-10 flex justify-between items-start">
          <div className="pt-2">
            <h2 className="text-3xl font-bold text-white tracking-tight font-display mb-1">
              Update Record
            </h2>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
               <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></span>
               EDITING / {selectedTable}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all hover:bg-white/10 active:scale-90"
            aria-label="Close"
          >
             <Icon name="X" size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-2 no-scrollbar space-y-8 pb-10 font-sans">
          {schema
            .filter((col) => !col.pk)
            .map((col) => {
              const isPasswordField = col.name.toLowerCase().includes("password");

              return (
                <div key={col.name} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {col.name}
                      {col.notnull && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>
                    <span className="text-[9px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-full uppercase border border-white/5">{col.type}</span>
                  </div>

                  {isPasswordField ? (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-4xl p-5 space-y-4 relative group">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                          <Icon name="Lock" size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest px-1">
                          Secured Field (Bcrypt)
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={visiblePasswords[col.name] ? "text" : "password"}
                          value={formData[col.name] || ""}
                          onChange={(e) => onFormChange(col.name, e.target.value)}
                          placeholder="Leave empty to keep existing password..."
                          className="w-full px-5 py-4 pr-12 bg-slate-950/40 border border-blue-500/30 rounded-2xl text-white placeholder-blue-950/30 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-mono text-sm transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(col.name)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-950/40 hover:text-blue-400 transition-colors"
                        >
                          {visiblePasswords[col.name] ? (
                            <Icon name="EyeOff" size={16} strokeWidth={2.5} />
                          ) : (
                            <Icon name="Eye" size={16} strokeWidth={2.5} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : col.type.toLowerCase().includes("text") || col.type.toLowerCase().includes("varchar") ? (
                    <textarea
                      value={formData[col.name] || ""}
                      onChange={(e) => onFormChange(col.name, e.target.value)}
                      placeholder={`Update content for ${col.name.toLowerCase()}...`}
                      className="w-full h-32 px-5 py-4 bg-slate-950/40 border border-white/5 rounded-4xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 font-mono text-sm leading-relaxed transition-all resize-none shadow-inner"
                    />
                  ) : (
                    <input
                      type={ col.type.toLowerCase().includes("int") || col.type.toLowerCase().includes("real") ? "number" : "text" }
                      step={ col.type.toLowerCase().includes("real") ? "0.01" : undefined }
                      value={formData[col.name] || ""}
                      onChange={(e) => onFormChange(col.name, e.target.value)}
                      placeholder={`New val: ${col.name.toLowerCase()}`}
                      className="w-full px-5 py-4 bg-slate-950/40 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 font-mono text-sm transition-all shadow-inner"
                    />
                  )}
                </div>
              );
            })}
        </div>

        <div className="shrink-0 p-10 border-t border-white/5 flex gap-4 mt-auto">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onEditRow}
            disabled={loading}
            className="flex-1 btn-primary py-4! shadow-xl shadow-blue-500/20 bg-linear-to-r! from-blue-500! to-indigo-600!"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                 <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 Saving...
              </span>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
