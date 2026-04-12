import React from 'react';
import styles from './Input.module.css';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export default function TextInput({ value, onChange, error, className, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}
