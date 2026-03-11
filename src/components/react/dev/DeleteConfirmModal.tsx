import React from "react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-red-600/30 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-red-400">
            Confirm Deletion
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-300">
            You are about to permanently delete a row from <span className="font-semibold text-cyan-300">{tableName}</span>.
          </p>

          {rowData && Object.keys(rowData).length > 0 && (
            <div className="bg-slate-700/30 rounded p-4 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-400 mb-2">Row Data:</p>
              {Object.entries(rowData).map(([key, value]) => (
                <div key={key} className="text-xs text-slate-400 flex justify-between gap-2">
                  <span className="font-mono text-slate-500">{key}:</span>
                  <span className="font-mono text-slate-300 text-right truncate">
                    {value === null ? (
                      <span className="italic text-slate-600">null</span>
                    ) : typeof value === "object" ? (
                      JSON.stringify(value)
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-red-300 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex-shrink-0 p-6 border-t border-slate-700/50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-slate-700/40 text-slate-300 rounded border border-slate-600/30 hover:bg-slate-700/60 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-900/40 text-red-300 rounded border border-red-700/30 hover:bg-red-900/60 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
