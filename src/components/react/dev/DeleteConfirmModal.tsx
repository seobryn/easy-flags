import { Icon } from "@/components/react/shared/Icon";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  rowId: string | number | null;
  rowData: Record<string, unknown> | null;
  tableName: string | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  rowId,
  rowData,
  tableName,
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#0b0e14]/80 backdrop-blur-2xl border border-rose-500/20 rounded-[40px] shadow-3xl max-w-lg w-full animate-in zoom-in-95 duration-500 overflow-hidden text-sans">
        {/* Internal Aurora Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 blur-[100px] -z-10" />

        {/* Header Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[2px] bg-linear-to-r from-transparent via-rose-500/50 to-transparent"></div>
        
        <div className="p-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
             <Icon name="Trash2" size={28} />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-4">
            Critical <span className="bg-linear-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">Action</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
            Confirming this will permanently erase the record from <span className="text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/10 font-mono text-xs">{tableName}</span>.
          </p>

          {rowData && Object.keys(rowData).length > 0 && (
            <div className="bg-slate-950/40 border border-white/5 rounded-[28px] p-8 mb-10 max-h-56 overflow-y-auto custom-scrollbar relative shadow-inner space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Object Identity Snapshot</p>
              {Object.entries(rowData).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-6 border-b border-white/[0.03] pb-3 last:border-0 last:pb-0">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate w-1/3">{key}</span>
                  <span className="text-[11px] font-mono text-rose-300 font-bold truncate text-right w-2/3">
                    {value === null ? <span className="italic opacity-30">null</span> : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
 
          <div className="flex gap-5">
             <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-4.5 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white transition-colors border border-transparent hover:bg-white/5 rounded-2xl"
            >
              Go Back
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-[1.8] py-4.5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-white bg-linear-to-r from-rose-600 to-red-700 shadow-2xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
               {loading ? (
                <span className="flex items-center justify-center gap-3">
                   <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                   Purging...
                </span>
               ) : "Destroy Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
