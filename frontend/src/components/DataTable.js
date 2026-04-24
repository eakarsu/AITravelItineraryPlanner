import React, { useState } from 'react';
import useDataTable from '../hooks/useDataTable';
import ConfirmDialog from './ConfirmDialog';
import { exportToCSV, exportToPDF } from '../utils/export';

const DataTable = ({
  data,
  columns,
  columnLabels,
  title,
  formatValue,
  onRowClick,
  onEdit,
  onDelete,
  onBulkDelete,
}) => {
  const {
    searchTerm,
    handleSearch,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalFiltered,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    itemsPerPage,
  } = useDataTable(data, columns);

  const [bulkConfirm, setBulkConfirm] = useState(false);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalFiltered);

  const handleBulkDelete = () => {
    setBulkConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setBulkConfirm(false);
    if (onBulkDelete) {
      await onBulkDelete(Array.from(selectedIds));
      clearSelection();
    }
  };

  const handleExportCSV = () => {
    const labels = columns.map((col) => columnLabels[col] || col);
    exportToCSV(data, columns, labels, title || 'export');
  };

  const handleExportPDF = () => {
    const labels = columns.map((col) => columnLabels[col] || col);
    exportToPDF(data, columns, labels, title || 'Export');
  };

  return (
    <div className="dt-wrapper">
      {/* Toolbar */}
      <div className="dt-toolbar">
        <div className="dt-toolbar-left">
          <div className="dt-search">
            <svg className="dt-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="dt-search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchTerm && (
              <button className="dt-search-clear" onClick={() => handleSearch('')}>
                ×
              </button>
            )}
          </div>
        </div>
        <div className="dt-toolbar-right">
          <button className="dt-export-btn" onClick={handleExportCSV} title="Export CSV">
            CSV
          </button>
          <button className="dt-export-btn" onClick={handleExportPDF} title="Export PDF">
            PDF
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="dt-bulk-bar">
          <span>{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</span>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            Delete Selected
          </button>
          <button className="btn btn-secondary btn-sm" onClick={clearSelection}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="dt-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="dt-checkbox-col">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                  onChange={toggleSelectAll}
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="dt-sortable-th"
                  onClick={() => handleSort(col)}
                >
                  {columnLabels[col] || col}
                  {sortColumn === col && (
                    <span className="dt-sort-indicator">
                      {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="dt-empty">
                  {searchTerm ? 'No results found' : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className={selectedIds.has(item.id) ? 'dt-row-selected' : ''}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  <td className="dt-checkbox-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col}>{formatValue ? formatValue(item[col], col) : (item[col] ?? '-')}</td>
                  ))}
                  <td className="table-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit && onEdit(item, e);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete && onDelete(item, e);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalFiltered > 0 && (
        <div className="dt-pagination">
          <span className="dt-pagination-info">
            Showing {startItem}–{endItem} of {totalFiltered} items
          </span>
          <div className="dt-pagination-controls">
            <button
              className="dt-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              «
            </button>
            <button
              className="dt-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹
            </button>
            <span className="dt-page-num">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="dt-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ›
            </button>
            <button
              className="dt-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              »
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={bulkConfirm}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkConfirm(false)}
        danger
      />
    </div>
  );
};

export default DataTable;
