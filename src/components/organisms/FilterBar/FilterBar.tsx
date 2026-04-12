import React from 'react';
import SearchBar from '../../molecules/SearchBar';
import styles from './FilterBar.module.css';

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode; 
  className?: string;
}

export default function FilterBar({ searchValue, onSearchChange, searchPlaceholder, children, className }: FilterBarProps) {
  return (
    <div className={`${styles.filterBar} ${className || ''}`}>
      <div className={styles.searchWrap}>
        <SearchBar 
          value={searchValue} 
          onChange={onSearchChange} 
          placeholder={searchPlaceholder || 'Cari...'} 
          onClear={() => onSearchChange('')}
        />
      </div>
      {children && (
        <div className={styles.filters}>
          {children}
        </div>
      )}
    </div>
  );
}
