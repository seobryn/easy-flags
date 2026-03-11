import { useCallback } from "react";
import type { ColumnInfo } from "../types";
import { useInspectorAPI } from "./useInspectorAPI";

interface UseEditRowHandlerProps {
  selectedTable: string | null;
  schema: ColumnInfo[];
  onSuccess: () => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Custom hook for handling edit row operations with type conversion
 */
export function useEditRowHandler({
  selectedTable,
  schema,
  onSuccess,
  onError,
  onLoadingChange,
}: UseEditRowHandlerProps) {
  const api = useInspectorAPI();

  const convertFormDataToTypes = useCallback(
    (formData: Record<string, string>): Record<string, unknown> => {
      const convertedData: Record<string, unknown> = {};

      for (const col of schema) {
        const value = formData[col.name];
        if (value !== undefined && value !== "") {
          if (col.type.toLowerCase().includes("int")) {
            convertedData[col.name] = parseInt(value, 10);
          } else if (col.type.toLowerCase().includes("real")) {
            convertedData[col.name] = parseFloat(value);
          } else {
            convertedData[col.name] = value;
          }
        }
      }

      return convertedData;
    },
    [schema]
  );

  const editRow = useCallback(
    async (rowId: string | number, formData: Record<string, string>) => {
      if (!selectedTable) return;

      onLoadingChange?.(true);

      try {
        const convertedData = convertFormDataToTypes(formData);
        await api.updateRow(selectedTable, rowId, convertedData);
        onSuccess();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update row";
        onError?.(message);
      } finally {
        onLoadingChange?.(false);
      }
    },
    [selectedTable, api, convertFormDataToTypes, onSuccess, onError, onLoadingChange]
  );

  return { editRow, convertFormDataToTypes };
}
