import { useState, useMemo, useCallback } from 'react';

const useDataTable = (data, columns, itemsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Search: filter across all visible columns
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = item[col];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      // Try numeric comparison
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum) && aVal !== '' && bVal !== '') {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      // String comparison
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, safePage, itemsPerPage]);

  const handleSort = useCallback((column) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDirection((d) => {
          if (d === 'asc') return 'desc';
          // Reset sort
          setSortColumn(null);
          return 'asc';
        });
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === paginatedData.length) {
        return new Set();
      }
      return new Set(paginatedData.map((item) => item.id));
    });
  }, [paginatedData]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Reset page when sort changes
  const handleSortWithReset = useCallback((column) => {
    handleSort(column);
    setCurrentPage(1);
  }, [handleSort]);

  return {
    searchTerm,
    handleSearch,
    sortColumn,
    sortDirection,
    handleSort: handleSortWithReset,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalFiltered: sortedData.length,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    itemsPerPage,
  };
};

export default useDataTable;
