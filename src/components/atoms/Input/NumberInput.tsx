import React from 'react';
import styles from './Input.module.css';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | '';
  onChange: (value: number | '') => void;
  error?: boolean;
  format?: 'rupiah' | 'decimal' | 'integer';
}

export default function NumberInput({ value, onChange, error, format, className, ...props }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <input
      type="number"
      className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
}
