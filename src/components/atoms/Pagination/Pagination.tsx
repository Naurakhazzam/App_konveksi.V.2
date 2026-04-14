'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show max 5 page numbers
  const renderPages = () => {
    if (totalPages <= 5) return pages;
    
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.controls}>
        <button 
          type="button"
          className={styles.btn} 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          title="Halaman Pertama"
        >
          <ChevronsLeft size={16} />
        </button>
        <button 
          type="button"
          className={styles.btn} 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          title="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className={styles.pages}>
        {renderPages().map(page => (
          <button
            type="button"
            key={page}
            className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <button 
          type="button"
          className={styles.btn} 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          title="Halaman Berikutnya"
        >
          <ChevronRight size={16} />
        </button>
        <button 
          type="button"
          className={styles.btn} 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages}
          title="Halaman Terakhir"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
      
      <div className={styles.info}>
        Halaman {currentPage} dari {totalPages}
      </div>
    </div>
  );
}
