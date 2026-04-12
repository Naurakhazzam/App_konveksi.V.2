import React, { useState, useRef } from 'react';
import { useBundleStore } from '@/stores/useBundleStore';
import { Bundle } from '@/types';
import { TahapKey, validateCanTerima } from '@/lib/utils/production-helpers';
import styles from './ScanInput.module.css';

interface ScanInputProps {
  onFound: (bundle: Bundle) => void;
  onError: (msg: string) => void;
  tahap?: TahapKey;
}

export default function ScanInput({ onFound, onError, tahap }: ScanInputProps) {
  const { bundles, getBundleByBarcode } = useBundleStore();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (v.length >= 3) {
      let eligible = bundles;
      if (tahap) {
        eligible = bundles.filter(b => {
          const val = validateCanTerima(b, tahap);
          const isOngoing = b.statusTahap[tahap].status === 'terima';
          return val.canTerima || isOngoing;
        });
      }

      const filtered = eligible
        .map(b => b.barcode)
        .filter(bc => bc.toLowerCase().includes(v.toLowerCase()))
        .slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const doScan = (barcode: string) => {
    const trimmed = barcode.trim();
    setSuggestions([]);
    if (!trimmed) return;
    
    // Coba exact match dulu
    let found = getBundleByBarcode(trimmed);
    
    // Jika tidak exact, cari partial match di antrian yang valid
    if (!found) {
      let eligible = bundles;
      if (tahap) {
        eligible = bundles.filter(b => validateCanTerima(b, tahap).canTerima || b.statusTahap[tahap].status === 'terima');
      }
      const partials = eligible.filter(b => b.barcode.toLowerCase().includes(trimmed.toLowerCase()));
      
      if (partials.length === 1) {
        found = partials[0];
      } else if (partials.length > 1) {
        onError(`Ditemukan ${partials.length} kecocokan untuk kode "${trimmed}". Ketik lebih lengkap.`);
        setValue('');
        return;
      }
    }

    if (found) {
      onFound(found);
      setValue('');
    } else {
      onError(`Bundle dengan kode "${trimmed}" tidak antri di tahap ini / tidak ditemukan.`);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      doScan(value);
    }
    if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (bc: string) => {
    setValue(bc);
    setSuggestions([]);
    doScan(bc);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.scanInput}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Scan atau ketik barcode bundle…"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.scanBtn}
          onClick={() => doScan(value)}
        >
          🔍 Scan
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map(bc => (
            <li key={bc} className={styles.suggestionItem} onClick={() => handleSuggestionClick(bc)}>
              {bc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
