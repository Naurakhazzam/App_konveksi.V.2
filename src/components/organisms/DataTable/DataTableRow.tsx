import React from 'react';
import { motion } from 'framer-motion';
import styles from './DataTable.module.css';
import { Column } from './DataTable';

interface DataTableRowProps<T> {
  row: T;
  columns: Column<T>[];
  index: number;
  onClick?: (row: T) => void;
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as any
    }
  },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
};

export default function DataTableRow<T>({ row, columns, index, onClick }: DataTableRowProps<T>) {
  return (
    <motion.tr 
      className={`${styles.tr} ${onClick ? styles.clickable : ''}`} 
      onClick={onClick ? () => onClick(row) : undefined}
      variants={rowVariants}
      layout
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
    </motion.tr>
  );
}
