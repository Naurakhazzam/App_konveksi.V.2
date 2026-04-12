import React from 'react';
import styles from './DataTable.module.css';
import { Column } from './DataTable';

interface DataTableHeaderProps<T> {
  columns: Column<T>[];
  onSort?: (key: string) => void;
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
}

export default function DataTableHeader<T>({ 
  columns, 
  onSort, 
  sortKey, 
  sortDirection 
}: DataTableHeaderProps<T>) {
  return (
    <thead className={styles.thead}>
      <tr>
        {columns.map((col, index) => {
          const isSortable = col.sortable !== false && onSort;
          const isActive = sortKey === col.key;
          
          return (
            <th 
              key={col.key || index} 
              className={`${styles.th} ${isSortable ? styles.sortable : ''}`}
              style={{ 
                width: col.width, 
                textAlign: col.align || 'left',
                cursor: isSortable ? 'pointer' : 'default'
              }}
              onClick={() => isSortable && onSort(col.key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                {col.header}
                {isSortable && (
                  <span style={{ fontSize: '10px', opacity: isActive ? 1 : 0.3 }}>
                    {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

