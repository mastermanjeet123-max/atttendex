/**
 * AttendX - DataTable Component
 * Reusable data table with search, sort, and pagination.
 */
import { useState, useMemo, useCallback } from 'react';
import { FiSearch, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './DataTable.css';

export default function DataTable({
  columns = [],         // [{ key, label, sortable, render }]
  data = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  emptyMessage = 'No data found',
  className = '',
  onRowClick,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  /* Filter data by search */
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const key = col.key || col.accessor;
        const val = row[key];
        return val != null && String(val).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  /* Sort data */
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  /* Paginate */
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  /* Handlers */
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageSizeChange = useCallback((e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  /* Generate page numbers */
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div className={`data-table ${className}`}>
      {/* Toolbar */}
      <div className="data-table__toolbar">
        {searchable && (
          <div className="data-table__search">
            <FiSearch className="data-table__search-icon" />
            <input
              type="text"
              className="data-table__search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        )}
        <div className="data-table__toolbar-actions">
          <div className="data-table__per-page">
            <span>Show</span>
            <select value={pageSize} onChange={handlePageSizeChange}>
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="data-table__container">
        <table className="data-table__table">
          <thead>
            <tr>
              {columns.map((col) => {
                const columnKey = col.key || col.accessor;
                const columnLabel = col.label || col.header;
                return (
                  <th
                    key={columnKey}
                    className={`data-table__th ${sortConfig.key === columnKey ? 'sorted' : ''}`}
                    onClick={() => col.sortable !== false && handleSort(columnKey)}
                  >
                    {columnLabel}
                    {col.sortable !== false && sortConfig.key === columnKey && (
                      <span className="data-table__sort-icon">
                        {sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || row._id || rowIdx}
                  className="data-table__tr"
                  onClick={() => onRowClick?.(row)}
                  style={onRowClick ? { cursor: 'pointer' } : {}}
                >
                  {columns.map((col) => {
                    const columnKey = col.key || col.accessor;
                    return (
                      <td key={columnKey} className="data-table__td">
                        {col.render ? col.render(row[columnKey], row) : row[columnKey]}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="data-table__empty">
                  <span className="data-table__empty-text">{emptyMessage}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="data-table__pagination">
          <span className="data-table__page-info">
            Showing {startItem} to {endItem} of {sortedData.length} entries
          </span>
          <div className="data-table__page-buttons">
            <button
              className="data-table__page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <FiChevronLeft />
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`data-table__page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="data-table__page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
