import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: boolean;
  placeholder?: string;
}

export default function Select({ value, onChange, options, placeholder, disabled, error, className, ...props }: SelectProps) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <select
        className={`${styles.select} ${error ? styles.error : ''} ${!value ? styles.placeholderSelect : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        {...props}
      >
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className={styles.icon} size={16} />
    </div>
  );
}
