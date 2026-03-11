import type { ColumnInfo } from "./types";

interface FilterSectionProps {
  schema: ColumnInfo[];
  filterColumn: string | null;
  filterText: string;
  onFilterColumnChange: (column: string | null) => void;
  onFilterTextChange: (text: string) => void;
  onClearFilter: () => void;
  hasData: boolean;
}

export function FilterSection({
  schema,
  filterColumn,
  filterText,
  onFilterColumnChange,
  onFilterTextChange,
  onClearFilter,
  hasData,
}: FilterSectionProps) {
  if (!hasData) return null;

  return (
    <div className="flex gap-2 items-center mb-4 pb-4 border-b border-slate-700/50">
      <label className="text-sm text-slate-300 font-medium whitespace-nowrap">
        🔍 Filter:
      </label>
      <select
        value={filterColumn || ""}
        onChange={(e) => onFilterColumnChange(e.target.value || null)}
        className="px-2 py-1 border border-slate-600 bg-slate-700 text-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500"
      >
        <option value="">Select column...</option>
        {schema.map((col) => (
          <option key={col.name} value={col.name}>
            {col.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={filterText}
        onChange={(e) => onFilterTextChange(e.target.value)}
        placeholder="Filter value..."
        className="flex-1 px-3 py-1 border border-slate-600 bg-slate-700 text-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500"
      />
      {(filterText || filterColumn) && (
        <button
          onClick={onClearFilter}
          className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600 transition-colors font-medium whitespace-nowrap"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
