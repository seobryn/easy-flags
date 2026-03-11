import { useCallback } from "react";
import type { ColumnInfo } from "../types";
import { useInspectorAPI } from "./useInspectorAPI";

export interface UseAddRowHandlerProps {
  selectedTable: string | null;
  schema: ColumnInfo[];
  onSuccess: () => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Custom hook for handling add row operations with type conversion
 */
export function useAddRowHandler({
  selectedTable,
  schema,
  onSuccess,
  onError,
  onLoadingChange,
}: UseAddRowHandlerProps) {
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
    [schema],
  );

  const addRow = useCallback(
    async (formData: Record<string, string>) => {
      if (!selectedTable) return;

      onLoadingChange?.(true);

      try {
        const convertedData = convertFormDataToTypes(formData);

        // Identify password fields that need hashing
        const passwordFields = Object.keys(convertedData).filter((key) =>
          key.toLowerCase().includes("password"),
        );

        // Include metadata for password fields
        const payload = {
          ...convertedData,
          ...(passwordFields.length > 0 && { _passwordFields: passwordFields }),
        };

        await api.addRow(selectedTable, payload);
        onSuccess();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add row";
        onError?.(message);
      } finally {
        onLoadingChange?.(false);
      }
    },
    [
      selectedTable,
      api,
      convertFormDataToTypes,
      onSuccess,
      onError,
      onLoadingChange,
    ],
  );

  return { addRow, convertFormDataToTypes };
}
