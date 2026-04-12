import React from 'react';
import styles from './DataTable.module.css';
import DataTableHeader from './DataTableHeader';
import DataTableRow from './DataTableRow';

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
}

import EmptyState from '../../molecules/EmptyState';

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
}: DataTableProps<T>) {
  return (
    <div 
      className={styles.container} 
      style={{ maxHeight, overflowY: maxHeight ? 'auto' : 'visible' }}
    >
      <table className={`${styles.table} ${striped ? styles.striped : ''} ${compact ? styles.compact : ''}`}>
        <DataTableHeader 
          columns={columns} 
          onSort={onSort} 
          sortKey={sortKey} 
          sortDirection={sortDirection} 
        />
        <tbody className={styles.tbody}>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                <div className={styles.loadingWrapper}>Loading...</div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className={styles.emptyWrapper}>
                  <EmptyState title="Data Kosong" message={emptyMessage} />
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <DataTableRow 
                key={row[keyField] || index} 
                row={row} 
                columns={columns} 
                index={index} 
                onClick={onRowClick} 
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
