import React, { useState, useRef } from 'react';
import { useBundleStore } from '@/stores/useBundleStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { Bundle } from '@/types';
import { TahapKey, validateCanTerima, TAHAP_LABEL } from '@/lib/utils/production-helpers';
import styles from './ScanInput.module.css';

interface ScanInputProps {
  onFound: (bundle: Bundle) => void;
  onError: (msg: string) => void;
  tahap?: TahapKey;
}

/**
 * Cocokkan query dengan barcode secara cerdas.
 *
 * Jika query adalah angka murni (misal "00001" atau "1"):
 *   → Cari segmen numerik di barcode, lalu bandingkan dengan padStart.
 *   → "00001" hanya cocok dengan segmen "00001" atau "000001" (padding leading zero).
 *   → Tidak akan mencocokkan "000010", "000011", dst.
 *
 * Jika query berisi huruf:
 *   → Gunakan includes biasa.
 */
function matchesSearch(barcode: string, query: string): boolean {
  const bc = barcode.toLowerCase();
  const q = query.toLowerCase();

  if (/^\d+$/.test(q)) {
    // Ekstrak semua segmen angka dari barcode (misal "PO100-00001-BDL01" → ["100","00001","01"])
    const numericSegments = bc.match(/\d+/g) || [];
    return numericSegments.some(seg => {
      // Hanya bandingkan jika panjang segmen >= panjang query
      if (seg.length < q.length) return false;
      // Pad query ke panjang segmen dengan leading zeros, lalu bandingkan
      const paddedQuery = q.padStart(seg.length, '0');
      return seg === paddedQuery;
    });
  }

  return bc.includes(q);
}

export default function ScanInput({ onFound, onError, tahap }: ScanInputProps) {
  const { bundles, getBundleByBarcode } = useBundleStore();
  const { model, warna, sizes } = useMasterStore();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Bundle[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const getBundleLabel = (b: Bundle) => {
    const modelName = model.find(m => m.id === b.model)?.nama || '';
    const warnaName = warna.find(w => w.id === b.warna)?.nama || '';
    const sizeName = (sizes as any[]).find(s => s.id === b.size)?.nama || '';
    return [modelName, warnaName, sizeName].filter(Boolean).join(' / ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (v.length >= 2) {
      // Show all matches in suggestions, regardless of eligibility, 
      // so users can search for finished bundles to view history.
      const filtered = bundles
        .filter(b => matchesSearch(b.barcode, v))
        .slice(0, 8); // Slightly more suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const doScan = (barcode: string) => {
    const trimmed = barcode.trim();
    setSuggestions([]);
    if (!trimmed) return;

    // 1. Cari exact match dulu
    let found = getBundleByBarcode(trimmed);

    // 2. Jika tidak exact, gunakan matchesSearch untuk partial
    if (!found) {
      const partials = bundles.filter(b => matchesSearch(b.barcode, trimmed));
      if (partials.length === 1) {
        found = partials[0];
      } else if (partials.length > 1) {
        onError(`Ditemukan ${partials.length} kecocokan untuk kode "${trimmed}". Ketik lebih lengkap atau scan barcode langsung.`);
        setValue('');
        return;
      }
    }

    // 3. Jika ketemu, cek validasi tahap
    if (found) {
      const validation = validateCanTerima(found, tahap || 'cutting');
      const isOngoing = tahap && found.statusTahap[tahap].status === 'terima';
      const isFinished = tahap && found.statusTahap[tahap].status === 'selesai';

      if (validation.canTerima || isOngoing || isFinished) {
        onFound(found);
        setValue('');
      } else {
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

  const handleSuggestionClick = (barcode: string) => {
    setValue(barcode);
    setSuggestions([]);
    doScan(barcode);
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
            setTimeout(() => setSuggestions([]), 200);
          }}
          placeholder="Scan atau ketik kode unik bundle…"
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
          {suggestions.map(b => (
            <li
              key={b.barcode}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(b.barcode)}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{b.barcode}</span>
              <span style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--color-text-sub)',
                fontFamily: 'inherit',
                marginTop: '2px',
                letterSpacing: 0
              }}>
                {getBundleLabel(b)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
