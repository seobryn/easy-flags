import { useState, useEffect, useCallback } from "react";
import type { TableInfo, ColumnInfo } from "../types";
import { useInspectorAPI } from "./useInspectorAPI";

interface UseTableInspectionReturn {
  tables: TableInfo[];
  selectedTable: string | null;
  schema: ColumnInfo[];
  data: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  viewTab: "structure" | "records";
  rowLimit: number;
  deleting: string | number | null;

  setSelectedTable: (table: string | null) => void;
  setViewTab: (tab: "structure" | "records") => void;
  setRowLimit: (limit: number) => void;
  fetchTables: () => Promise<void>;
  refetchData: () => Promise<void>;
  deleteRow: (rowId: string | number) => Promise<void>;
  handleRowLimitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Custom hook for managing table inspection state and operations
 * Handles table selection, schema/data fetching, and deletion
 */
export function useTableInspection(): UseTableInspectionReturn {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"structure" | "records">("records");
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowLimit, setRowLimit] = useState(100);
  const [deleting, setDeleting] = useState<string | number | null>(null);

  const api = useInspectorAPI();

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch schema and data when table is selected
  useEffect(() => {
    if (selectedTable) {
      setViewTab("records");
      fetchTableSchemaAndData();
    }
  }, [selectedTable]);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.fetchTables();
      const tablesList = (result.tables as TableInfo[]) || [];
      setTables(tablesList);
      if (tablesList.length > 0) {
        setSelectedTable(tablesList[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchTableSchemaAndData = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);

    try {
      const [schemaResult, dataResult] = await Promise.all([
        api.fetchTableSchema(selectedTable),
        api.fetchTableData(selectedTable, rowLimit),
      ]);

      setSchema((schemaResult.schema as ColumnInfo[]) || []);
      setData((dataResult.data as Record<string, unknown>[]) || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch table data",
      );
    } finally {
      setLoading(false);
    }
  }, [api, selectedTable, rowLimit]);

  const refetchData = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);

    try {
      const result = await api.fetchTableData(selectedTable, rowLimit);
      setData((result.data as Record<string, unknown>[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [api, selectedTable, rowLimit]);

  const deleteRow = useCallback(
    async (rowId: string | number) => {
      if (!selectedTable) return;

      setDeleting(rowId);
      setError(null);

      try {
        const primaryKeyColumn = schema.find((col) => col.pk === 1);
        if (!primaryKeyColumn) {
          throw new Error("Could not determine primary key");
        }

        await api.deleteRow(selectedTable, rowId, primaryKeyColumn.name);
        await refetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete row");
      } finally {
        setDeleting(null);
      }
    },
    [api, selectedTable, schema, refetchData],
  );

  const handleRowLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newLimit = parseInt(e.target.value) || 100;
      setRowLimit(newLimit);
    },
    [],
  );

  return {
    tables,
    selectedTable,
    schema,
    data,
    loading,
    error,
    viewTab,
    rowLimit,
    deleting,
    setSelectedTable,
    setViewTab,
    setRowLimit,
    fetchTables,
    refetchData,
    deleteRow,
    handleRowLimitChange,
  };
}
