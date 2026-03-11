import { useState, useCallback } from "react";

interface UseDeleteConfirmModalReturn {
  isOpen: boolean;
  rowId: string | number | null;
  rowData: Record<string, unknown> | null;
  openDeleteConfirm: (rowId: string | number, rowData: Record<string, unknown>) => void;
  closeDeleteConfirm: () => void;
}

/**
 * Custom hook for managing delete confirmation modal state
 */
export function useDeleteConfirmModal(): UseDeleteConfirmModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [rowId, setRowId] = useState<string | number | null>(null);
  const [rowData, setRowData] = useState<Record<string, unknown> | null>(null);

  const openDeleteConfirm = useCallback(
    (id: string | number, data: Record<string, unknown>) => {
      setRowId(id);
      setRowData(data);
      setIsOpen(true);
    },
    [],
  );

  const closeDeleteConfirm = useCallback(() => {
    setIsOpen(false);
    setRowId(null);
    setRowData(null);
  }, []);

  return {
    isOpen,
    rowId,
    rowData,
    openDeleteConfirm,
    closeDeleteConfirm,
  };
}
