import React from "react";
import type { ColumnInfo } from "./types";

interface DataTableProps {
  schema: ColumnInfo[];
  paginatedData: Record<string, unknown>[];
  deleting: string | number | null;
  onDeleteRow: (rowId: string | number) => void;
  onEditRow: (rowId: string | number, rowData: Record<string, string>) => void;
}

export function DataTable({
  schema,
  paginatedData,
  deleting,
  onDeleteRow,
  onEditRow,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-700/50 border-b-2 border-cyan-700/30 sticky top-0">
            <th className="text-left px-3 py-2 font-semibold text-cyan-300 whitespace-nowrap w-12">
              Action
            </th>
            {schema.map((col) => (
              <th
                key={col.name}
                className="text-left px-3 py-2 font-semibold text-cyan-300 whitespace-nowrap"
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, idx) => {
            const primaryKeyColumn = schema.find((c) => c.pk);
            const rowId = (
              primaryKeyColumn ? row[primaryKeyColumn.name] : idx
            ) as string | number;

            return (
              <tr
                key={idx}
                className="border-b border-slate-700/50 hover:bg-slate-700/30"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const rowData: Record<string, string> = {};
                        schema.forEach((col) => {
                          rowData[col.name] = String(row[col.name] ?? "");
                        });
                        onEditRow(rowId, rowData);
                      }}
                      className="px-2 py-1 text-xs bg-blue-900/40 text-blue-300 rounded border border-blue-700/30 hover:bg-blue-900/60 disabled:opacity-50 transition-colors font-medium"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteRow(rowId)}
                      disabled={deleting === rowId}
                      className="px-2 py-1 text-xs bg-red-900/40 text-red-300 rounded border border-red-700/30 hover:bg-red-900/60 disabled:opacity-50 transition-colors font-medium"
                    >
                      {deleting === rowId ? "..." : "🗑️"}
                    </button>
                  </div>
                </td>
                {schema.map((col) => (
                  <td
                    key={col.name}
                    className="px-3 py-2 text-slate-300 max-w-xs overflow-hidden text-ellipsis"
                    title={String(row[col.name] ?? "")}
                  >
                    {row[col.name] ? (
                      <span className="font-mono">
                        {typeof row[col.name] === "object"
                          ? JSON.stringify(row[col.name])
                          : String(row[col.name])}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">null</span>
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
