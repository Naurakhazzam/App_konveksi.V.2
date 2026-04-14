import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DataTable.module.css';
import DataTableHeader from './DataTableHeader';
import DataTableRow from './DataTableRow';
import EmptyState from '../../molecules/EmptyState';
import Skeleton from '../../atoms/Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  compact?: boolean;
  maxHeight?: string;
  stickyHeader?: boolean;
  onSort?: (key: string) => void;
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
  sequenceIndex?: number;
  reverse?: boolean;
  hideBeam?: boolean;
  itemsPerPage?: number; // Enable pagination if provided
}

const tbodyVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage = 'Tidak ada data',
  loading,
  onRowClick,
  striped = true,
  compact = false,
  maxHeight,
  stickyHeader = false,
  onSort,
  sortKey,
  sortDirection,
  sequenceIndex,
  reverse = true,
  hideBeam = false,
  itemsPerPage = 20,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination Logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  // Reset to page 1 if data changes significantly
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  // Automated simultaneous logic: use sequenceIndex for stable random-offset if provided
  const index = sequenceIndex ?? 0;
  const randomOffset = (index * 1.87) % 4;
  const beamDelay = { 
    animationDelay: `-${randomOffset}s`,
    '--beam-direction': reverse ? 'reverse' : 'normal'
  } as React.CSSProperties;

  return (
    <div 
      className={styles.container} 
      style={{ maxHeight, overflowY: maxHeight ? 'auto' : 'visible', position: 'relative' }}
      data-beam-container="true"
    >
      {!hideBeam && <div className="beam-border" style={beamDelay} aria-hidden="true" />}
      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${striped ? styles.striped : ''} ${compact ? styles.compact : ''}`}>
          <DataTableHeader 
            columns={columns} 
            onSort={onSort} 
            sortKey={sortKey} 
            sortDirection={sortDirection} 
          />
          <motion.tbody 
            className={styles.tbody}
            variants={tbodyVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col, ci) => (
                    <td key={`col-${ci}`} className={styles.td}>
                      <Skeleton height={20} width={col.width || '80%'} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.emptyWrapper}>
                    <EmptyState title="Data Kosong" message={emptyMessage} />
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {paginatedData.map((row, index) => (
                  <DataTableRow 
                    key={row[keyField] || index} 
                    row={row} 
                    columns={columns} 
                    index={index} 
                    onClick={onRowClick} 
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, data.length)} dari {data.length} data
          </div>
          <div className={styles.paginationControls}>
            <button 
              className={styles.pageBtn} 
              onClick={() => handlePageChange(1)} 
              disabled={currentPage === 1}
              title="Awal"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className={styles.pageBtn} 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              title="Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button 
                    key={pageNum}
                    className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePage : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              className={styles.pageBtn} 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              title="Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className={styles.pageBtn} 
              onClick={() => handlePageChange(totalPages)} 
              disabled={currentPage === totalPages}
              title="Akhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
