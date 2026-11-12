/**
 * DataTable Component - Full-Featured Data Table
 * Features sorting, pagination, search filtering, row selection,
 * responsive layout, column visibility, and export actions.
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight,
  ChevronLeft, ChevronRight, Search, Filter,
  Download, MoreVertical, Check, Columns3
} from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array<{key: string, label: string, sortable?: boolean, width?: string, render?: Function, align?: string, visible?: boolean}>} props.columns
 * @param {Array<Object>} props.data - Array of data objects
 * @param {string} [props.title] - Table title
 * @param {boolean} [props.searchable=true] - Show search box
 * @param {string} [props.searchPlaceholder='Cari data...'] - Search placeholder
 * @param {boolean} [props.selectable=false] - Enable row selection
 * @param {boolean} [props.paginated=true] - Enable pagination
 * @param {number} [props.pageSize=10] - Items per page
 * @param {number[]} [props.pageSizeOptions] - Page size options
 * @param {boolean} [props.striped=true] - Striped rows
 * @param {boolean} [props.hoverable=true] - Hover effect on rows
 * @param {boolean} [props.bordered=false] - Show borders
 * @param {Function} [props.onRowClick] - Row click handler
 * @param {Function} [props.onSelectionChange] - Selection change callback
 * @param {Array<{label: string, icon?: React.ReactNode, onClick: Function, variant?: string}>} [props.actions] - Toolbar actions
 * @param {React.ReactNode} [props.emptyState] - Custom empty state
 * @param {boolean} [props.loading=false] - Loading state
 * @param {boolean} [props.exportable=false] - Show CSV export
 */
export function DataTable({
  columns: initialColumns = [],
  data = [],
  title = '',
  searchable = true,
  searchPlaceholder = 'Cari data...',
  selectable = false,
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  striped = true,
  hoverable = true,
  bordered = false,
  onRowClick,
  onSelectionChange,
  actions = [],
  emptyState,
  loading = false,
  exportable = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Initialize column visibility
  useEffect(() => {
    const visibility = {};
    initialColumns.forEach(col => {
      visibility[col.key] = col.visible !== false;
    });
    setColumnVisibility(visibility);
  }, [initialColumns]);

  // Visible columns
  const columns = useMemo(() =>
    initialColumns.filter(col => columnVisibility[col.key] !== false),
    [initialColumns, columnVisibility]
  );

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'id');
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = paginated ? Math.ceil(sortedData.length / pageSize) : 1;
  const paginatedData = paginated
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  // Reset page when data/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, data.length]);

  // Sort handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(paginatedData.map((_, i) => (currentPage - 1) * pageSize + i));
      setSelectedRows(allIds);
    }
  }, [paginatedData, selectedRows, currentPage, pageSize]);

  const handleSelectRow = useCallback((index) => {
    const globalIndex = (currentPage - 1) * pageSize + index;
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(globalIndex)) {
        next.delete(globalIndex);
      } else {
        next.add(globalIndex);
      }
      return next;
    });
  }, [currentPage, pageSize]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedItems = Array.from(selectedRows).map(i => data[i]).filter(Boolean);
      onSelectionChange(selectedItems);
    }
  }, [selectedRows, onSelectionChange, data]);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    const headers = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row =>
      columns.map(col => {
        const val = row[col.key];
        const strVal = String(val ?? '').replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || 'data'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [columns, sortedData, title]);

  // Page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const isAllSelected = paginatedData.length > 0 && selectedRows.size === paginatedData.length;

  return (
    <div className="data-table-container" style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        gap: '12px',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Left: Title & Selection Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {title && (
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              margin: 0
            }}>
              {title}
            </h3>
          )}
          {selectable && selectedRows.size > 0 && (
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--primary-600)',
              background: 'var(--primary-50)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--primary-200)'
            }}>
              {selectedRows.size} dipilih
            </span>
          )}
          <span style={{
            fontSize: '0.78rem',
            color: 'var(--text-subtle)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {filteredData.length} data
          </span>
        </div>

        {/* Right: Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {searchable && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              height: '36px',
              background: 'var(--secondary-50)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              minWidth: '200px'
            }}>
              <Search size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Column Visibility Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              title="Atur kolom"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: showColumnMenu ? 'var(--primary-50)' : 'var(--bg-card)',
                color: showColumnMenu ? 'var(--primary-500)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Columns3 size={16} />
            </button>

            {showColumnMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                minWidth: '180px',
                padding: '8px 4px',
                animation: 'slideDown 0.15s ease'
              }}>
                {initialColumns.map(col => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--secondary-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={columnVisibility[col.key] !== false}
                      onChange={() => setColumnVisibility(prev => ({
                        ...prev,
                        [col.key]: !prev[col.key]
                      }))}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV */}
          {exportable && (
            <button
              onClick={handleExportCSV}
              title="Ekspor CSV"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                height: '36px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-300)';
                e.currentTarget.style.color = 'var(--primary-500)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
          )}

          {/* Custom Actions */}
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                height: '36px',
                border: action.variant === 'primary' ? 'none' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: action.variant === 'primary' ? 'var(--primary-500)' : 'var(--bg-card)',
                color: action.variant === 'primary' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'inherit',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.87rem'
        }}>
          {/* Header */}
          <thead>
            <tr style={{
              background: 'var(--secondary-50)',
              borderBottom: '2px solid var(--border-color)'
            }}>
              {/* Select All Checkbox */}
              {selectable && (
                <th style={{
                  padding: '12px 16px',
                  width: '48px',
                  textAlign: 'center'
                }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                  />
                </th>
              )}

              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    padding: '12px 16px',
                    textAlign: col.align || 'left',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    width: col.width || 'auto',
                    borderRight: bordered ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (col.sortable !== false) e.currentTarget.style.background = 'var(--secondary-100)';
                  }}
                  onMouseLeave={(e) => {
                    if (col.sortable !== false) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <span style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        <ChevronUp
                          size={10}
                          style={{
                            color: sortConfig.key === col.key && sortConfig.direction === 'asc'
                              ? 'var(--primary-500)'
                              : 'var(--secondary-300)',
                            marginBottom: '-3px'
                          }}
                        />
                        <ChevronDown
                          size={10}
                          style={{
                            color: sortConfig.key === col.key && sortConfig.direction === 'desc'
                              ? 'var(--primary-500)'
                              : 'var(--secondary-300)'
                          }}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {selectable && <td style={{ padding: '14px 16px' }}><div style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'var(--secondary-100)', animation: 'pulse 1.5s ease infinite' }} /></td>}
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: '14px 16px' }}>
                      <div style={{
                        height: '14px',
                        borderRadius: '4px',
                        background: 'var(--secondary-100)',
                        width: `${50 + Math.random() * 50}%`,
                        animation: 'pulse 1.5s ease infinite',
                        animationDelay: `${i * 0.1}s`
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ padding: '48px 20px', textAlign: 'center' }}
                >
                  {emptyState || (
                    <div style={{ color: 'var(--text-subtle)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, margin: '0 auto 12px' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="15" y2="17" />
                      </svg>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {searchQuery ? 'Tidak ditemukan data yang cocok' : 'Belum ada data'}
                      </p>
                      <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Data akan muncul di sini'}
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              paginatedData.map((row, rowIndex) => {
                const globalIndex = (currentPage - 1) * pageSize + rowIndex;
                const isSelected = selectedRows.has(globalIndex);

                return (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick && onRowClick(row, globalIndex)}
                    style={{
                      background: isSelected
                        ? 'var(--primary-50)'
                        : striped && rowIndex % 2 === 1
                          ? 'var(--secondary-50)'
                          : 'transparent',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (hoverable) e.currentTarget.style.background = isSelected ? 'var(--primary-100)' : 'var(--secondary-50)';
                    }}
                    onMouseLeave={(e) => {
                      if (hoverable) {
                        e.currentTarget.style.background = isSelected
                          ? 'var(--primary-50)'
                          : striped && rowIndex % 2 === 1
                            ? 'var(--secondary-50)'
                            : 'transparent';
                      }
                    }}
                  >
                    {/* Row Checkbox */}
                    {selectable && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(rowIndex);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                        />
                      </td>
                    )}

                    {/* Data Cells */}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        style={{
                          padding: '12px 16px',
                          textAlign: col.align || 'left',
                          color: 'var(--text-main)',
                          borderRight: bordered ? '1px solid var(--border-color)' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: col.width || '300px'
                        }}
                      >
                        {col.render
                          ? col.render(row[col.key], row, globalIndex)
                          : (row[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Page size selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontFamily: 'inherit',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>per halaman</span>
          </div>

          {/* Info & Page numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginRight: '8px', fontVariantNumeric: 'tabular-nums' }}>
              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length}
            </span>

            {/* Page Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  color: currentPage === 1 ? 'var(--secondary-300)' : 'var(--text-muted)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  color: currentPage === 1 ? 'var(--secondary-300)' : 'var(--text-muted)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    border: currentPage === page ? 'none' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: currentPage === page ? 'var(--primary-500)' : 'var(--bg-card)',
                    color: currentPage === page ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: currentPage === page ? 600 : 400,
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  color: currentPage === totalPages ? 'var(--secondary-300)' : 'var(--text-muted)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  color: currentPage === totalPages ? 'var(--secondary-300)' : 'var(--text-muted)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default DataTable;
