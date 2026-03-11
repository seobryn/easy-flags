import React, { useEffect } from "react";
import type { ColumnInfo } from "./dev";
import {
  SchemaTable,
  FilterSection,
  PaginationControls,
  AddRowModal,
  EditRowModal,
  DataTable,
} from "./dev";
import {
  useTableInspection,
  useDataManipulation,
  useAddRowModal,
  useEditRowModal,
  useAddRowHandler,
  useEditRowHandler,
} from "./dev/hooks";

export default function DatabaseInspector() {
  // Custom hooks for state management
  const tableInspection = useTableInspection();
  const dataManipulation = useDataManipulation({
    data: tableInspection.data,
    itemsPerPage: 20,
  });
  const addRowModal = useAddRowModal();
  const editRowModal = useEditRowModal();

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

        {tableInspection.error && (
          <div className="mb-6 rounded-lg bg-red-950/50 border border-red-700/50 p-4 text-red-400">
            ⚠️ Error: {tableInspection.error}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-2 border-b border-slate-700/50 overflow-x-auto pb-0">
            {tableInspection.loading && tableInspection.tables.length === 0 ? (
              <div className="text-center py-4 flex-1">
                <div className="inline-block animate-spin">⏳</div>
                <p className="text-slate-400 text-sm mt-2">Loading tables...</p>
              </div>
            ) : (
              <>
                {tableInspection.tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => tableInspection.setSelectedTable(table.name)}
                    className={`px-4 py-3 font-mono text-sm whitespace-nowrap transition-colors border-b-2 ${
                      tableInspection.selectedTable === table.name
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
                onClick={tableInspection.fetchTables}
                className="px-3 py-2 text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-600/50 rounded hover:bg-cyan-500/30 hover:border-cyan-500 transition-colors font-medium whitespace-nowrap"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {tableInspection.selectedTable ? (
            <div>
              {/* Sub-tabs Navigation */}
              <div className="flex gap-1 border-b border-slate-700/50 mb-6">
                <button
                  onClick={() => tableInspection.setViewTab("records")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    tableInspection.viewTab === "records"
                      ? "border-cyan-500 text-cyan-300 bg-slate-800/30"
                      : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
                >
                  📊 Records
                </button>
                <button
                  onClick={() => tableInspection.setViewTab("structure")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    tableInspection.viewTab === "structure"
                      ? "border-cyan-500 text-cyan-300 bg-slate-800/30"
                      : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
                >
                  📋 Structure
                </button>
              </div>

              <div className="space-y-6">
                {/* Schema Section */}
                {tableInspection.viewTab === "structure" && (
                  <SchemaTable
                    selectedTable={tableInspection.selectedTable}
                    schema={tableInspection.schema}
                  />
                )}

                {/* Data Section */}
                {tableInspection.viewTab === "records" && (
                  <div className="bg-slate-800/80 rounded-xl shadow-lg p-6 border border-cyan-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-cyan-300">
                        Data{" "}
                        {tableInspection.data.length > 0 &&
                          `(page ${dataManipulation.currentPage} of ${dataManipulation.getTotalPages()}, showing ${dataManipulation.getPaginatedData().length} of ${dataManipulation.getFilteredData().length} rows)`}
                      </h2>
                      <div className="flex gap-2 items-center flex-wrap">
                        <label className="text-sm text-slate-300 font-medium">
                          Per Page:
                        </label>
                        <select
                          value="20"
                          onChange={(e) => {
                            // Items per page is fixed at 20 in this version
                            // Can be made dynamic if needed
                          }}
                          className="px-2 py-1 border border-slate-600 bg-slate-700 text-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500"
                        >
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <label className="text-sm text-slate-300 font-medium">
                          Query Limit:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={tableInspection.rowLimit}
                          onChange={tableInspection.handleRowLimitChange}
                          className="w-20 px-2 py-1 border border-slate-600 bg-slate-700 text-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={tableInspection.refetchData}
                          disabled={tableInspection.loading}
                          className="px-4 py-1 bg-cyan-600/80 text-cyan-100 rounded text-sm hover:bg-cyan-600 disabled:opacity-50 transition-colors font-medium"
                        >
                          {tableInspection.loading ? "Loading..." : "Fetch"}
                        </button>
                        <button
                          onClick={addRowModal.openAddModal}
                          className="px-4 py-1 bg-green-600/80 text-green-100 rounded text-sm hover:bg-green-600 transition-colors font-medium whitespace-nowrap"
                        >
                          ➕ Add Row
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
                      <div className="text-center py-12">
                        <div className="inline-block text-3xl animate-spin">
                          ⏳
                        </div>
                        <p className="text-slate-400 mt-2">Loading data...</p>
                      </div>
                    ) : tableInspection.data.length > 0 ? (
                      <div className="space-y-4">
                        <DataTable
                          schema={tableInspection.schema}
                          paginatedData={dataManipulation.getPaginatedData()}
                          deleting={tableInspection.deleting}
                          onDeleteRow={tableInspection.deleteRow}
                          onEditRow={(rowId, rowData) => {
                            editRowModal.openEditModal(rowId, rowData);
                          }}
                        />

                        <PaginationControls
                          currentPage={dataManipulation.currentPage}
                          totalPages={dataManipulation.getTotalPages()}
                          onPageChange={dataManipulation.setCurrentPage}
                        />
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
    </div>
  );
}
