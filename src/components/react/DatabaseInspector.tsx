import { useEffect } from "react";
import {
  SchemaTable,
  FilterSection,
  PaginationControls,
  AddRowModal,
  EditRowModal,
  DeleteConfirmModal,
  DataTable,
} from "./dev";
import {
  useTableInspection,
  useDataManipulation,
  useAddRowModal,
  useEditRowModal,
  useDeleteConfirmModal,
  useAddRowHandler,
  useEditRowHandler,
} from "./dev/hooks";
import { Icon } from "./shared/Icon";

export default function DatabaseInspector() {
  // Custom hooks for state management
  const tableInspection = useTableInspection();
  const dataManipulation = useDataManipulation({
    data: tableInspection.data,
    itemsPerPage: 20,
  });
  const addRowModal = useAddRowModal();
  const editRowModal = useEditRowModal();
  const deleteConfirmModal = useDeleteConfirmModal();

  // Handler for adding rows
  const { addRow: addRowToTable } = useAddRowHandler({
    selectedTable: tableInspection.selectedTable,
    schema: tableInspection.schema,
    onSuccess: () => {
      addRowModal.closeAddModal();
      tableInspection.refetchData();
    },
  });

  // Handler for editing rows
  const { editRow: editRowInTable } = useEditRowHandler({
    selectedTable: tableInspection.selectedTable,
    schema: tableInspection.schema,
    onSuccess: () => {
      editRowModal.closeEditModal();
      tableInspection.refetchData();
    },
  });

  // Reset pagination when filter changes
  useEffect(() => {
    dataManipulation.resetPagination();
  }, [dataManipulation.filterText, dataManipulation.filterColumn]);

  return (
    <div className="w-full pt-10 pb-20">
      <div className="space-y-10">
        {/* Header */}
        <div className="mb-12 pb-10 border-b border-white/5">
          <h1 className="section-title mb-4! flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Icon name="Database" size={28} />
            </div>
            <span className="text-gradient text-4xl md:text-5xl">Database Inspector</span>
          </h1>
          <p className="text-slate-400 text-xl leading-relaxed max-w-3xl">
            Secure development tool for real-time inspection, monitoring, and 
            manipulation of your database records.
          </p>
        </div>

        {tableInspection.error && (
          <div className="mb-8 rounded-2xl bg-red-500/10 border border-red-500/20 p-5 text-red-400 flex items-center gap-3">
            <Icon name="AlertTriangle" size={20} />
            <div className="font-medium text-sm">
              Error: {tableInspection.error}
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-10">
          <div className="flex items-center gap-2 border-b border-white/5 overflow-x-auto pb-0 no-scrollbar">
            {tableInspection.loading && tableInspection.tables.length === 0 ? (
              <div className="text-center py-8 flex-1">
                <Icon name="Clock" size={32} className="inline-block animate-spin text-cyan-500" />
                <p className="text-cyan-500/60 text-sm mt-3 font-bold tracking-widest uppercase">
                  Loading tables...
                </p>
              </div>
            ) : tableInspection.tables.length === 0 ? (
              <div className="text-center py-8 flex-1">
                <p className="text-slate-500 text-sm font-medium">
                  No tables found in the database.
                </p>
              </div>
            ) : (
              <div className="flex gap-1">
                {tableInspection.tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => tableInspection.setSelectedTable(table.name)}
                    className={`px-6 py-4 font-display text-sm font-bold tracking-tight whitespace-nowrap transition-all relative group ${
                      tableInspection.selectedTable === table.name
                        ? "text-cyan-400"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span>{table.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        tableInspection.selectedTable === table.name ? 'text-cyan-500/60' : 'text-slate-600'
                      }`}>
                        {table.rowCount} rows
                      </span>
                    </div>
                    {tableInspection.selectedTable === table.name && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-400 to-blue-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="ml-auto pb-2 pl-4">
              <button
                onClick={tableInspection.fetchTables}
                className="btn-secondary text-xs! py-2! px-4! rounded-xl! border-white/10"
              >
                <Icon name="RefreshCw" size={12} className="inline mr-1" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {tableInspection.selectedTable ? (
            <div>
              {/* Sub-tabs Navigation */}
              <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-2xl w-fit">
                <button
                  onClick={() => tableInspection.setViewTab("records")}
                  className={`px-6 py-2.5 text-sm font-bold tracking-tight rounded-xl transition-all flex items-center gap-2 ${
                    tableInspection.viewTab === "records"
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Icon name="Activity" size={16} />
                  Records
                </button>
                <button
                  onClick={() => tableInspection.setViewTab("structure")}
                  className={`px-6 py-2.5 text-sm font-bold tracking-tight rounded-xl transition-all flex items-center gap-2 ${
                    tableInspection.viewTab === "structure"
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Icon name="FileText" size={16} />
                  Structure
                </button>
              </div>

              <div className="space-y-8">
                {/* Schema Section */}
                {tableInspection.viewTab === "structure" && (
                  <div className="card bg-white/1!">
                    <SchemaTable
                      selectedTable={tableInspection.selectedTable}
                      schema={tableInspection.schema}
                    />
                  </div>
                )}

                {/* Data Section */}
                {tableInspection.viewTab === "records" && (
                  <div className="card bg-white/1! p-8!">
                    <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Table Records
                      </h2>
                      <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Per Page:
                          </label>
                          <select
                            value="20"
                            onChange={(e) => {}}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                          >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Limit:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={tableInspection.rowLimit}
                            onChange={tableInspection.handleRowLimitChange}
                            className="w-24 px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                          />
                        </div>
                        <button
                          onClick={tableInspection.refetchData}
                          disabled={tableInspection.loading}
                          className="btn-secondary text-xs! py-2! px-5!"
                        >
                          {tableInspection.loading ? "..." : "Fetch"}
                        </button>
                        <button
                          onClick={addRowModal.openAddModal}
                          className="btn-primary text-xs! py-2! px-5! shadow-none hover:shadow-cyan-500/20"
                        >
                          <Icon name="Plus" size={14} className="inline mr-1" /> Add Row
                        </button>
                      </div>
                    </div>

                    {/* Filter Section */}
                    <FilterSection
                      schema={tableInspection.schema}
                      filterColumn={dataManipulation.filterColumn}
                      filterText={dataManipulation.filterText}
                      onFilterColumnChange={dataManipulation.setFilterColumn}
                      onFilterTextChange={dataManipulation.setFilterText}
                      onClearFilter={() => {
                        dataManipulation.setFilterText("");
                        dataManipulation.setFilterColumn(null);
                      }}
                      hasData={tableInspection.data.length > 0}
                    />

                    {tableInspection.loading ? (
                      <div className="text-center py-16">
                        <Icon name="Clock" size={48} className="inline-block animate-spin text-cyan-500" />
                        <p className="text-slate-400 text-lg mt-4">
                          Loading data...
                        </p>
                      </div>
                    ) : tableInspection.data.length > 0 ? (
                      <div className="space-y-6">
                        <DataTable
                          schema={tableInspection.schema}
                          paginatedData={dataManipulation.getPaginatedData()}
                          deleting={tableInspection.deleting}
                          onRequestDeleteRow={(rowId, rowData) => {
                            deleteConfirmModal.openDeleteConfirm(
                              rowId,
                              rowData,
                            );
                          }}
                          onEditRow={(rowId, rowData) => {
                            editRowModal.openEditModal(rowId, rowData);
                          }}
                        />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 border-t border-white/5">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            Page {dataManipulation.currentPage} of{" "}
                            {dataManipulation.getTotalPages()} •{" "}
                            {dataManipulation.getFilteredData().length} total records
                          </p>
                          <PaginationControls
                            currentPage={dataManipulation.currentPage}
                            totalPages={dataManipulation.getTotalPages()}
                            onPageChange={dataManipulation.setCurrentPage}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white/2! rounded-3xl border border-dashed border-white/10">
                        <Icon name="Folder" size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-slate-500 font-medium tracking-tight">
                          No records found in this table.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card bg-white/2! p-20! text-center border-dashed">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-4xl mx-auto mb-8">
                <Icon name="MousePointer" size={40} className="text-cyan-500/50" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Select a Table</h2>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                Choose a table from the list above to explore its structure 
                and manipulate its data records.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Row Modal */}
      <AddRowModal
        isOpen={addRowModal.showAddModal}
        selectedTable={tableInspection.selectedTable}
        schema={tableInspection.schema}
        formData={addRowModal.formData}
        loading={tableInspection.loading}
        onFormChange={addRowModal.handleFormChange}
        onAddRow={() => addRowToTable(addRowModal.formData)}
        onClose={addRowModal.closeAddModal}
      />

      {/* Edit Row Modal */}
      <EditRowModal
        isOpen={editRowModal.showEditModal}
        selectedTable={tableInspection.selectedTable}
        schema={tableInspection.schema}
        formData={editRowModal.formData}
        loading={tableInspection.loading}
        onFormChange={editRowModal.handleFormChange}
        onEditRow={() =>
          editRowInTable(editRowModal.editingRowId ?? "", editRowModal.formData)
        }
        onClose={editRowModal.closeEditModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        rowId={deleteConfirmModal.rowId}
        rowData={deleteConfirmModal.rowData}
        tableName={tableInspection.selectedTable}
        loading={tableInspection.deleting === deleteConfirmModal.rowId}
        onConfirm={() => {
          if (deleteConfirmModal.rowId !== null) {
            tableInspection.deleteRow(deleteConfirmModal.rowId);
            deleteConfirmModal.closeDeleteConfirm();
          }
        }}
        onCancel={deleteConfirmModal.closeDeleteConfirm}
      />
    </div>
  );
}
