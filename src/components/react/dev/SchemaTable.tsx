import type { ColumnInfo } from "./types";

interface SchemaTableProps {
  selectedTable: string | null;
  schema: ColumnInfo[];
}

export function SchemaTable({ selectedTable, schema }: SchemaTableProps) {
  return (
    <div className="bg-slate-800/80 rounded-xl shadow-lg p-6 border border-cyan-700/30">
      <h2 className="text-lg font-semibold text-cyan-300 mb-4">
        Schema: <span className="text-cyan-400 font-mono">{selectedTable}</span>
      </h2>

      {schema.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 border-b-2 border-cyan-700/30">
                <th className="text-left px-4 py-2 font-semibold text-cyan-300">
                  Column
                </th>
                <th className="text-left px-4 py-2 font-semibold text-cyan-300">
                  Type
                </th>
                <th className="text-left px-4 py-2 font-semibold text-cyan-300">
                  Default
                </th>
                <th className="text-left px-4 py-2 font-semibold text-cyan-300">
                  Constraints
                </th>
              </tr>
            </thead>
            <tbody>
              {schema.map((col) => (
                <tr
                  key={col.cid}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="px-4 py-2 font-mono text-slate-200">
                    {col.pk ? "🔑" : ""} {col.name}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{col.type}</td>
                  <td className="px-4 py-2 text-slate-400 font-mono text-xs">
                    {col.dflt_value ? (
                      <span className="text-slate-300">{col.dflt_value}</span>
                    ) : (
                      <span className="text-slate-500 italic">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {(!!col.pk || !!col.notnull) && (
                      <div className="flex gap-1 flex-wrap">
                        {!!col.pk && (
                          <span className="px-2 py-1 bg-purple-900/40 text-purple-300 rounded text-xs border border-purple-700/30">
                            PK
                          </span>
                        )}
                        {!!col.notnull && (
                          <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs border border-red-700/30">
                            NOT NULL
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-400">No schema available</p>
      )}
    </div>
  );
}
