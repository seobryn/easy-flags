import React, { useState, useEffect } from "react";

interface TableInfo {
  name: string;
  rowCount: number;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export default function DatabaseInspector() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"structure" | "records">("structure");
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowLimit, setRowLimit] = useState(100);

  // Load tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Load table schema and data when selection changes
  useEffect(() => {
    if (selectedTable) {
      setViewTab("structure");
      fetchTableSchema(selectedTable);
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  async function fetchTables() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dev/inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getTables" }),
      });

      if (!response.ok) throw new Error("Failed to fetch tables");
      const result = await response.json();
      setTables(result.tables);
      if (result.tables.length > 0) {
        setSelectedTable(result.tables[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTableSchema(tableName: string) {
    try {
      const response = await fetch("/api/dev/inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getTableSchema", table: tableName }),
      });

      if (!response.ok) throw new Error("Failed to fetch schema");
      const result = await response.json();
      setSchema(result.schema);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function fetchTableData(tableName: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/dev/inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTableData",
          table: tableName,
          limit: rowLimit,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const handleRowLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(e.target.value) || 100;
    setRowLimit(newLimit);
  };

  const refetchData = () => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-300 mb-2">
            🗄️ Database Inspector
          </h1>
          <p className="text-slate-400">
            Development tool to inspect SQLite database tables and data
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-950/50 border border-red-700/50 p-4 text-red-400">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-2 border-b border-slate-700/50 overflow-x-auto pb-0">
            {loading && tables.length === 0 ? (
              <div className="text-center py-4 flex-1">
                <div className="inline-block animate-spin">⏳</div>
                <p className="text-slate-400 text-sm mt-2">Loading tables...</p>
              </div>
            ) : (
              <>
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`px-4 py-3 font-mono text-sm whitespace-nowrap transition-colors border-b-2 ${
                      selectedTable === table.name
                        ? "border-b-2 border-cyan-500 text-cyan-300 bg-slate-800/50"
                        : "border-b-2 border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {table.name}
                    <div className="text-xs text-slate-500 font-normal">
                      ({table.rowCount} rows)
                    </div>
                  </button>
                ))}
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={fetchTables}
                className="px-3 py-2 text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-600/50 rounded hover:bg-cyan-500/30 hover:border-cyan-500 transition-colors font-medium whitespace-nowrap"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {selectedTable ? (
            <div>
              {/* Sub-tabs Navigation */}
              <div className="flex gap-1 border-b border-slate-700/50 mb-6">
                <button
                  onClick={() => setViewTab("structure")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    viewTab === "structure"
                      ? "border-cyan-500 text-cyan-300 bg-slate-800/30"
                      : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
                >
                  📋 Structure
                </button>
                <button
                  onClick={() => setViewTab("records")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    viewTab === "records"
                      ? "border-cyan-500 text-cyan-300 bg-slate-800/30"
                      : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
                >
                  📊 Records
                </button>
              </div>

              <div className="space-y-6">
                {/* Schema Section */}
                {viewTab === "structure" && (
                  <div className="bg-slate-800/80 rounded-xl shadow-lg p-6 border border-cyan-700/30">
                    <h2 className="text-lg font-semibold text-cyan-300 mb-4">
                      Schema:{" "}
                      <span className="text-cyan-400 font-mono">
                        {selectedTable}
                      </span>
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
                                <td className="px-4 py-2 text-slate-400">
                                  {col.type}
                                </td>
                                <td className="px-4 py-2 text-slate-400 font-mono text-xs">
                                  {col.dflt_value ? (
                                    <span className="text-slate-300">
                                      {col.dflt_value}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 italic">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-slate-400">
                                  <div className="flex gap-1 flex-wrap">
                                    {col.pk && (
                                      <span className="px-2 py-1 bg-purple-900/40 text-purple-300 rounded text-xs border border-purple-700/30">
                                        PK
                                      </span>
                                    )}
                                    {col.notnull && (
                                      <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs border border-red-700/30">
                                        NOT NULL
                                      </span>
                                    )}
                                  </div>
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
                )}

                {/* Data Section */}
                {viewTab === "records" && (
                  <div className="bg-slate-800/80 rounded-xl shadow-lg p-6 border border-cyan-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-cyan-300">
                        Data{" "}
                        {data.length > 0 && `(showing ${data.length} rows)`}
                      </h2>
                      <div className="flex gap-2 items-center">
                        <label className="text-sm text-slate-300 font-medium">
                          Limit:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={rowLimit}
                          onChange={handleRowLimitChange}
                          className="w-20 px-2 py-1 border border-slate-600 bg-slate-700 text-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={refetchData}
                          disabled={loading}
                          className="px-4 py-1 bg-cyan-600/80 text-cyan-100 rounded text-sm hover:bg-cyan-600 disabled:opacity-50 transition-colors font-medium"
                        >
                          {loading ? "Loading..." : "Fetch"}
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="text-center py-12">
                        <div className="inline-block text-3xl animate-spin">
                          ⏳
                        </div>
                        <p className="text-slate-400 mt-2">Loading data...</p>
                      </div>
                    ) : data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-700/50 border-b-2 border-cyan-700/30 sticky top-0">
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
                            {data.map((row, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-slate-700/50 hover:bg-slate-700/30"
                              >
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
                                      <span className="text-slate-500 italic">
                                        null
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-8">
                        No data in this table
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 rounded-xl shadow-lg p-12 text-center border border-cyan-700/30">
              <p className="text-slate-400 text-xl">
                Select a table from the tabs above to view its schema and data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
