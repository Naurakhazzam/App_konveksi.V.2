import React from 'react';
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
  reverse,
}: DataTableProps<T>) {
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
      <div className="beam-border" style={beamDelay} aria-hidden="true" />
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
                {data.map((row, index) => (
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
    </div>
  );
}
