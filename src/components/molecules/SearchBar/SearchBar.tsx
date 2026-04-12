import React from 'react';
import { SearchInput } from '../../atoms/Input';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  children?: React.ReactNode; 
  className?: string;
}

export default function SearchBar({ value, onChange, placeholder, onClear, children, className }: SearchBarProps) {
  return (
    <div className={`${styles.searchBar} ${className || ''}`}>
      <div className={styles.inputWrapper}>
        <SearchInput 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder} 
          onClear={onClear} 
        />
      </div>
      {children && (
        <div className={styles.actions}>
          {children}
        </div>
      )}
    </div>
  );
}
