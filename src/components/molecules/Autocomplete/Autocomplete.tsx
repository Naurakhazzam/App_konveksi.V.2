import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import TextInput from '../../atoms/Input/TextInput';
import styles from './Autocomplete.module.css';

export interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: string) => void;
  suggestions: string[];
  placeholder?: string;
  minChars?: number;
  className?: string;
}

export default function Autocomplete({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  minChars = 2,
  className
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));
  const showDropdown = open && value.length >= minChars && filtered.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < filtered.length) {
        handleSelect(filtered[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSelect = (item: string) => {
    onSelect(item);
    setOpen(false);
    setActiveIdx(-1);
  };

  return (
    <div className={`${styles.container} ${className || ''}`} ref={containerRef}>
      <TextInput
        value={value}
        onChange={(val) => {
          onChange(val);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <div className={styles.dropdown}>
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className={`${styles.item} ${idx === activeIdx ? styles.active : ''}`}
              onClick={() => handleSelect(item)}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
