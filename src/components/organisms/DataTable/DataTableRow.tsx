import React from 'react';
import styles from './DataTable.module.css';
import { Column } from './DataTable';

interface DataTableRowProps<T> {
  row: T;
  columns: Column<T>[];
  index: number;
  onClick?: (row: T) => void;
}

export default function DataTableRow<T>({ row, columns, index, onClick }: DataTableRowProps<T>) {
  return (
    <tr 
      className={`${styles.tr} ${onClick ? styles.clickable : ''}`} 
      onClick={onClick ? () => onClick(row) : undefined}
    >
      {columns.map((col, cIndex) => {
        const isNumeric = typeof (row as any)[col.key] === 'number';
        return (
          <td 
            key={col.key || cIndex} 
            className={`${styles.td} ${isNumeric ? styles.tdNumeric : ''}`}
            style={{ textAlign: col.align || 'left' }}
          >
            {col.render ? col.render((row as any)[col.key], row, index) : (row as any)[col.key]}
          </td>
        );
      })}
    </tr>
  );
}
