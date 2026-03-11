import type { ColumnInfo } from "../types";

interface APIResponse<T> {
  data?: T;
  tables?: unknown[];
  schema?: ColumnInfo[];
  [key: string]: unknown;
}

interface ConvertedData {
  [key: string]: unknown;
}

/**
 * Custom hook for handling all API calls to the database inspector
 */
export function useInspectorAPI() {
  const makeRequest = async <T>(
    action: string,
    payload?: Record<string, unknown>,
  ): Promise<APIResponse<T>> => {
    const response = await fetch("/api/dev/inspector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  };

  const fetchTables = () => makeRequest<unknown[]>("getTables");

  const fetchTableSchema = (table: string) =>
    makeRequest<ColumnInfo[]>("getTableSchema", { table });

  const fetchTableData = (table: string, limit: number) =>
    makeRequest<Record<string, unknown>[]>("getTableData", {
      table,
      limit,
    });

  const addRow = (table: string, rowData: ConvertedData) =>
    makeRequest("addRow", { table, rowData });

  const deleteRow = (table: string, rowId: string | number, primaryKey: string) =>
    makeRequest("deleteRow", { table, rowId, primaryKey });

  const updateRow = (table: string, rowId: string | number, rowData: ConvertedData) =>
    makeRequest("updateRow", { table, rowId, rowData });

  return {
    makeRequest,
    fetchTables,
    fetchTableSchema,
    fetchTableData,
    addRow,
    deleteRow,
    updateRow,
  };
}
