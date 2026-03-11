import type { ColumnInfo } from "./types";

interface AddRowModalProps {
  isOpen: boolean;
  selectedTable: string | null;
  schema: ColumnInfo[];
  formData: Record<string, string>;
  loading: boolean;
  onFormChange: (column: string, value: string) => void;
  onAddRow: () => void;
  onClose: () => void;
}

export function AddRowModal({
  isOpen,
  selectedTable,
  schema,
  formData,
  loading,
  onFormChange,
  onAddRow,
  onClose,
}: AddRowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-cyan-600/30 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
          <h2 className="text-2xl font-bold text-cyan-300">
            Add New Record to {selectedTable}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {schema
            .filter((col) => !col.pk)
            .map((col) => (
              <div key={col.name}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {col.name}
                  {col.notnull ? (
                    <span className="text-red-400"> *</span>
                  ) : (
                    <span className="text-slate-500"> (optional)</span>
                  )}
                </label>
                {col.type.toLowerCase().includes("text") ||
                col.type.toLowerCase().includes("varchar") ? (
                  <textarea
                    value={formData[col.name] || ""}
                    onChange={(e) => onFormChange(col.name, e.target.value)}
                    placeholder={`Enter ${col.name}...`}
                    className="w-full h-20 px-3 py-2 border border-slate-600 bg-slate-700 text-slate-200 rounded focus:outline-none focus:border-cyan-500 font-mono text-sm"
                  />
                ) : (
                  <input
                    type={
                      col.type.toLowerCase().includes("int")
                        ? "number"
                        : col.type.toLowerCase().includes("real")
                          ? "number"
                          : col.type.toLowerCase().includes("blob")
                            ? "text"
                            : "text"
                    }
                    step={
                      col.type.toLowerCase().includes("real")
                        ? "0.01"
                        : undefined
                    }
                    value={formData[col.name] || ""}
                    onChange={(e) => onFormChange(col.name, e.target.value)}
                    placeholder={`Enter ${col.name}...`}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-200 rounded focus:outline-none focus:border-cyan-500 font-mono text-sm"
                  />
                )}
                <p className="text-xs text-slate-400 mt-1">Type: {col.type}</p>
              </div>
            ))}
        </div>

        <div className="flex-shrink-0 p-6 border-t border-slate-700/50 flex gap-4 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAddRow}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? "Adding..." : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
