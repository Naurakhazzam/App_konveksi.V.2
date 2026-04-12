import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './Input.module.css';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder, onClear, className }: SearchInputProps) {
  return (
    <div className={`${styles.searchContainer} ${className || ''}`}>
      <Search className={styles.searchIcon} size={16} />
      <input
        type="text"
        className={`${styles.input} ${styles.searchInput}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && onClear && (
        <button type="button" className={styles.clearBtn} onClick={onClear}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
