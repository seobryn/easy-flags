import { useState, useCallback } from "react";

interface UseEditRowModalReturn {
  showEditModal: boolean;
  editingRowId: string | number | null;
  formData: Record<string, string>;
  openEditModal: (rowId: string | number, initialData: Record<string, string>) => void;
  closeEditModal: () => void;
  handleFormChange: (column: string, value: string) => void;
  resetFormData: () => void;
}

/**
 * Custom hook for managing edit row modal state and form data
 * Encapsulates all edit modal-related logic for cleaner component
 */
export function useEditRowModal(): UseEditRowModalReturn {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const openEditModal = useCallback(
    (rowId: string | number, initialData: Record<string, string>) => {
      setEditingRowId(rowId);
      setFormData(initialData);
      setShowEditModal(true);
    },
    []
  );

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingRowId(null);
    setFormData({});
  }, []);

  const handleFormChange = useCallback((column: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [column]: value,
    }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData({});
  }, []);

  return {
    showEditModal,
    editingRowId,
    formData,
    openEditModal,
    closeEditModal,
    handleFormChange,
    resetFormData,
  };
}
