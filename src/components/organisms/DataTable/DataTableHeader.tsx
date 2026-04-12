import React from 'react';
import styles from './DataTable.module.css';
import { Column } from './DataTable';

interface DataTableHeaderProps<T> {
  columns: Column<T>[];
}

export default function DataTableHeader<T>({ columns }: DataTableHeaderProps<T>) {
  return (
    <thead className={styles.thead}>
      <tr>
        {columns.map((col, index) => (
          <th 
            key={col.key || index} 
            className={styles.th}
            style={{ 
              width: col.width, 
              textAlign: col.align || 'left' 
            }}
          >
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
