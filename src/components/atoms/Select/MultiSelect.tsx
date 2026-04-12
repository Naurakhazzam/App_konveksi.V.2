import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import styles from './Select.module.css';
import Badge from '../Badge';

export interface SelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function MultiSelect({ value, onChange, options, placeholder, disabled, error, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(opt => value.includes(opt.value));
  const unselectedOptions = options.filter(opt => !value.includes(opt.value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!disabled) setOpen(!open);
  };

  const removeItem = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter(v => v !== valToRemove));
  };

  const selectItem = (valToAdd: string) => {
    onChange([...value, valToAdd]);
    setOpen(false);
  };

  return (
    <div className={`${styles.multiContainer} ${className || ''}`} ref={containerRef}>
      <div 
        className={`${styles.select} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''} ${styles.multiControl}`} 
        onClick={toggleOpen}
      >
        <div className={styles.tagsArea}>
          {selectedOptions.length === 0 && placeholder && (
            <span className={styles.placeholderSelect}>{placeholder}</span>
          )}
          {selectedOptions.map(opt => (
            <span key={opt.value} className={styles.tagWrapper}>
              <Badge variant="neutral" size="sm">
                {opt.label}
                <button type="button" className={styles.removeTagBtn} onClick={(e) => removeItem(e, opt.value)}>
                  <X size={10} />
                </button>
              </Badge>
            </span>
          ))}
        </div>
        <ChevronDown className={`${styles.icon} ${open ? styles.iconOpen : ''}`} size={16} />
      </div>

      {open && !disabled && (
        <div className={styles.dropdown}>
          {unselectedOptions.length === 0 ? (
            <div className={styles.noOptions}>Semua terpilih</div>
          ) : (
            unselectedOptions.map(opt => (
              <div key={opt.value} className={styles.option} onClick={() => selectItem(opt.value)}>
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
