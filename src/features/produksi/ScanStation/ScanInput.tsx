import React, { useState, useRef } from 'react';
import { useBundleStore } from '@/stores/useBundleStore';
import { Bundle } from '@/types';
import { TahapKey, validateCanTerima, TAHAP_LABEL } from '@/lib/utils/production-helpers';
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

    // 1. Cari bundle di seluruh data, bukan hanya yang eligible
    let found = getBundleByBarcode(trimmed);
    
    // 2. Jika tidak exact, cari partial match di seluruh data
    if (!found) {
      const partials = bundles.filter(b => b.barcode.toLowerCase().includes(trimmed.toLowerCase()));
      if (partials.length === 1) {
        found = partials[0];
      } else if (partials.length > 1) {
        onError(`Ditemukan ${partials.length} kecocokan untuk kode "${trimmed}". Ketik lebih lengkap.`);
        setValue('');
        return;
      }
    }

    // 3. Jika ketemu, baru cek validasi tahap
    if (found) {
      const validation = validateCanTerima(found, tahap || 'cutting');
      
      // Jika bundle sudah di-terima (sedang dikerjakan), boleh di-scan
      const isOngoing = tahap && found.statusTahap[tahap].status === 'terima';
      const isFinished = tahap && found.statusTahap[tahap].status === 'selesai';

      if (validation.canTerima || isOngoing || isFinished) {
        onFound(found);
        setValue('');
      } else {
        // TAMPILKAN ALASAN BLOKIR yang spesifik
        onError(validation.blockReason || `Bundle ini tidak valid di tahap ${tahap ? TAHAP_LABEL[tahap] : ''}`);
        setValue('');
      }
    } else {
      onError(`Bundle dengan kode "${trimmed}" tidak ditemukan.`);
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
          onBlur={() => {
            // Delay slightly so onClick on suggestion can trigger before list is removed
            setTimeout(() => setSuggestions([]), 200);
          }}
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
