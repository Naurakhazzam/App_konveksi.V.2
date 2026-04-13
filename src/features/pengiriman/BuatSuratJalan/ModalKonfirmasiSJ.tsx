'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import Button from '@/components/atoms/Button';
import { Bundle } from '@/types';
import styles from './ModalKonfirmasiSJ.module.css';

interface ModalKonfirmasiSJProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (qty: number, alasan?: string) => void;
  bundle: Bundle | null;
  artikelNama: string;
}

export default function ModalKonfirmasiSJ({
  open,
  onClose,
  onConfirm,
  bundle,
  artikelNama
}: ModalKonfirmasiSJProps) {
  const [qtySJ, setQtySJ] = useState<number>(0);
  const [alasan, setAlasan] = useState('');

  // Qty Packing as the baseline reference
  const qtyPacking = bundle?.statusTahap.packing.qtySelesai || 0;

  useEffect(() => {
    if (open && bundle) {
      setQtySJ(qtyPacking);
      setAlasan('');
    }
  }, [open, bundle, qtyPacking]);

  if (!bundle) return null;

  const isShortage = qtySJ < qtyPacking;
  const isSurplus = qtySJ > qtyPacking;
  const canConfirm = qtySJ > 0 && (isSurplus ? alasan.trim().length > 0 : true);

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className={styles.container}>
        <div className={styles.header}>
          <Heading level={4}>Konfirmasi QTY Pengiriman</Heading>
        </div>

        <div className={styles.content}>
          <div className={styles.bundleInfo}>
            <div className={styles.dataRow}>
              <Label color="sub">Barcode</Label>
              <strong>{bundle.barcode}</strong>
            </div>
            <div className={styles.dataRow}>
              <Label color="sub">Artikel</Label>
              <span>{artikelNama}</span>
            </div>
            <div className={styles.dataRow}>
              <Label color="sub">Qty Selesai Packing</Label>
              <strong className={styles.packingQty}>{qtyPacking} pcs</strong>
            </div>
          </div>

          <div className={styles.inputSection}>
            <Label>Qty yang Dikirim (Surat Jalan) <span className={styles.req}>*</span></Label>
            <input 
              type="number" 
              className={styles.input}
              value={qtySJ || ''}
              onChange={(e) => setQtySJ(parseInt(e.target.value) || 0)}
              autoFocus
            />
          </div>

          {isShortage && (
            <div className={styles.warningBox}>
              ⚠️ <strong>QTY BERKURANG</strong><br />
              Barang yang dikirim lebih sedikit dari hasil packing (Kurang {qtyPacking - qtySJ} pcs).
            </div>
          )}

          {isSurplus && (
            <div className={styles.surplusSection}>
              <div className={styles.infoBox}>
                ℹ️ <strong>QTY SURPLUS (+{qtySJ - qtyPacking} pcs)</strong><br />
                Harap jelaskan alasan kelebihan barang ini.
              </div>
              <Label>Alasan Kelebihan <span className={styles.req}>*</span></Label>
              <textarea 
                className={styles.textarea}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Contoh: Ada tambahan sisa sample yang layak kirim..."
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button 
            variant="primary" 
            onClick={() => onConfirm(qtySJ, alasan)}
            disabled={!canConfirm}
          >
            ✅ Tambahkan ke SJ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
