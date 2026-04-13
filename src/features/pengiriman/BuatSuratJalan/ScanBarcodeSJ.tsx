import React, { useState } from 'react';
import { Bundle } from '@/types';
import { useBundleStore } from '@/stores/useBundleStore';
import { useMasterStore } from '@/stores/useMasterStore';
import Panel from '@/components/molecules/Panel';
import { Label } from '@/components/atoms/Typography';
import ModalKonfirmasiSJ from './ModalKonfirmasiSJ';
import styles from './ScanBarcodeSJ.module.css';

interface ScanBarcodeSJProps {
  klienId: string;
  onBundleFound: (bundle: Bundle, qtySJ: number, alasan?: string) => void;
  addedBarcodes: string[];
}

export default function ScanBarcodeSJ({ klienId, onBundleFound, addedBarcodes }: ScanBarcodeSJProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingBundle, setPendingBundle] = useState<Bundle | null>(null);
  
  const { bundles } = useBundleStore();
  const { model, warna, sizes } = useMasterStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!klienId) {
      setError('Silakan pilih klien terlebih dahulu');
      return;
    }

    if (!input.trim()) return;

    // Search logic (full or partial like in scan station)
    const bundle = bundles.find(b => 
      b.barcode === input || b.barcode.includes(input.toUpperCase())
    );

    if (!bundle) {
      setError('Bundel tidak ditemukan');
      return;
    }

    // Validations
    if (bundle.statusTahap.packing.status !== 'selesai') {
      setError('Gagal: Bundel belum menyelesaikan tahap Packing');
      return;
    }

    if (bundle.suratJalanId) {
      setError(`Gagal: Bundel sudah masuk di Surat Jalan [${bundle.suratJalanId}]`);
      return;
    }

    if (addedBarcodes.includes(bundle.barcode)) {
      setError('Gagal: Bundel sudah ada dalam daftar pengiriman ini');
      return;
    }

    // Match found
    setPendingBundle(bundle);
    setError(null);
  };

  const handleConfirm = (qty: number, alasan?: string) => {
    if (pendingBundle) {
      onBundleFound(pendingBundle, qty, alasan);
      setPendingBundle(null);
      setInput('');
    }
  };

  const getArtikelNama = (b: Bundle) => {
    const m = model.find(it => it.id === b.model)?.nama || b.model;
    const w = warna.find(it => it.id === b.warna)?.nama || b.warna;
    const s = (sizes as any[]).find(it => it.id === b.size)?.nama || b.size;
    return `${m} - ${w} - ${s}`;
  };

  return (
    <Panel title="Scan Bundle Siap Kirim">
      <form onSubmit={handleSearch} className={styles.form}>
        <div className={styles.inputGroup}>
          <Label>Barcode Bundle / Kode Unik</Label>
          <input 
            type="text" 
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scan atau ketik barcode..."
            autoFocus
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.tip}>
          Mendukung pencarian parsial (Contoh: ketik "00001" untuk mencari bundel seri 1)
        </div>
      </form>

      <ModalKonfirmasiSJ
        open={!!pendingBundle}
        onClose={() => setPendingBundle(null)}
        bundle={pendingBundle}
        artikelNama={pendingBundle ? getArtikelNama(pendingBundle) : ''}
        onConfirm={handleConfirm}
      />
    </Panel>
  );
}
