import type { ColumnInfo } from "./types";
import { Icon } from "../shared/Icon";

interface DataTableProps {
  schema: ColumnInfo[];
  paginatedData: Record<string, unknown>[];
  deleting: string | number | null;
  onRequestDeleteRow: (
    rowId: string | number,
    rowData: Record<string, unknown>,
  ) => void;
  onEditRow: (rowId: string | number, rowData: Record<string, string>) => void;
}

export function DataTable({
  schema,
  paginatedData,
  deleting,
  onRequestDeleteRow,
  onEditRow,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/1">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 w-24">
              Actions
            </th>
            {schema.map((col) => (
              <th
                key={col.name}
                className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <span className={col.pk ? 'text-cyan-500' : ''}>{col.name}</span>
                  {col.pk && <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded-md">PK</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {paginatedData.map((row, idx) => {
            const primaryKeyColumn = schema.find((c) => c.pk);
            const rowId = (
              primaryKeyColumn ? row[primaryKeyColumn.name] : idx
            ) as string | number;

            return (
              <tr
                key={idx}
                className="group hover:bg-white/3 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const rowData: Record<string, string> = {};
                        schema.forEach((col) => {
                          rowData[col.name] = String(row[col.name] ?? "");
                        });
                        onEditRow(rowId, rowData);
                      }}
                      className="p-2 text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-all border border-blue-500/20"
                      title="Edit Row"
                    >
                      <Icon name="Edit" size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const rowData: Record<string, unknown> = {};
                        schema.forEach((col) => {
                          rowData[col.name] = row[col.name] || null;
                        });
                        onRequestDeleteRow(rowId, rowData);
                      }}
                      disabled={deleting === rowId}
                      className="p-2 text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50"
                      title="Delete Row"
                    >
                      {deleting === rowId ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="Trash" size={16} />
                      )}
                    </button>
                  </div>
                </td>
                {schema.map((col) => (
                  <td
                    key={col.name}
                    className="px-6 py-4 text-slate-300 max-w-xs overflow-hidden text-ellipsis font-mono text-sm"
                    title={String(row[col.name] ?? "")}
                  >
                    {row[col.name] ? (
                      <span className={col.pk ? 'text-cyan-400 font-bold' : ''}>
                        {typeof row[col.name] === "object"
                          ? JSON.stringify(row[col.name])
                          : String(row[col.name])}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic text-xs">null</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
