'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { AlasanReject } from '@/types';
import styles from './ModalKoreksiQTY.module.css';

// ─── QTY KURANG ────────────────────────────────────────────────────────────────

export type KoreksiKurangResult = {
  jenisKoreksi: 'reject' | 'hilang' | 'salah_hitung';
  alasanReject?: AlasanReject;
};

interface ModalKoreksiKurangProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: KoreksiKurangResult) => void;
  qtyKurang: number;
  tahapSaatIni: string;
  prevTahapLabel?: string;
}

export function ModalKoreksiKurang({
  open,
  onClose,
  onConfirm,
  qtyKurang,
  tahapSaatIni,
  prevTahapLabel,
}: ModalKoreksiKurangProps) {
  const { alasanReject } = useMasterStore();
  const [jenis, setJenis] = useState<'reject' | 'hilang' | 'salah_hitung' | ''>('');
  const [alasanRejectId, setAlasanRejectId] = useState('');

  const selectedAlasan = alasanReject.find((a) => a.id === alasanRejectId);
  const canSubmit = jenis && (jenis !== 'reject' || !!alasanRejectId);

  const handleClose = () => {
    setJenis('');
    setAlasanRejectId('');
    onClose();
  };

  const handleSubmit = () => {
    if (!jenis) return;
    onConfirm({
      jenisKoreksi: jenis,
      alasanReject: jenis === 'reject' ? selectedAlasan : undefined,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className={styles.container}>
        <Heading level={4}>Koreksi QTY — Kurang</Heading>

        <div className={styles.infoBox} data-type="warning">
          <span>⚠️ QTY berkurang <strong>{qtyKurang} pcs</strong> dari yang seharusnya</span>
        </div>

        <div className={styles.field}>
          <Label>Alasan <span className={styles.req}>*</span></Label>
          <select
            className={styles.select}
            value={jenis}
            onChange={(e) => {
              setJenis(e.target.value as typeof jenis);
              setAlasanRejectId('');
            }}
          >
            <option value="">-- Pilih alasan --</option>
            <option value="reject">Reject (cacat produk)</option>
            <option value="hilang">Hilang</option>
            <option value="salah_hitung">Salah Hitung di Proses Sebelumnya</option>
          </select>
        </div>

        {jenis === 'reject' && (
          <div className={styles.field}>
            <Label>Jenis Reject <span className={styles.req}>*</span></Label>
            <select
              className={styles.select}
              value={alasanRejectId}
              onChange={(e) => setAlasanRejectId(e.target.value)}
            >
              <option value="">-- Pilih jenis reject --</option>
              {alasanReject.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.bisaDiperbaiki ? 'bisa diperbaiki' : 'tidak bisa diperbaiki'})
                </option>
              ))}
            </select>

            {selectedAlasan && (
              <div className={styles.alasanInfo}>
                <div>
                  <span className={styles.infoLabel}>Tahap Bertanggung Jawab:</span>
                  <strong> {selectedAlasan.tahapBertanggungJawab.toUpperCase()}</strong>
                </div>
                <div>
                  <span className={styles.infoLabel}>Bisa Diperbaiki:</span>
                  <strong> {selectedAlasan.bisaDiperbaiki ? 'Ya' : 'Tidak'}</strong>
                </div>
                <div>
                  <span className={styles.infoLabel}>Dampak:</span>
                  <strong> {selectedAlasan.dampakPotongan === 'hpp_po' ? 'Potong HPP PO' : 'Potong Upah Tahap'}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {jenis === 'hilang' && (
          <div className={styles.infoBox} data-type="info">
            Potongan akan dibebankan ke **Tahap {prevTahapLabel || 'Sebelumnya'}** sebesar upah × {qtyKurang} pcs.
          </div>
        )}

        {jenis === 'salah_hitung' && (
          <div className={styles.infoBox} data-type="info">
            Potongan akan dibebankan ke **Tahap {prevTahapLabel || 'Sebelumnya'}** karena selisih hitung × {qtyKurang} pcs.
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            Konfirmasi Koreksi
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── QTY LEBIH ────────────────────────────────────────────────────────────────

export type KoreksiLebihResult = {
  alasanLebih: 'lebih_cutting' | 'koreksi_tahap_sebelumnya' | 'lainnya';
  alasanLebihText?: string;
};

interface ModalKoreksiLebihProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: KoreksiLebihResult) => void;
  qtyLebih: number;
  tahapSaatIni: string;
}

export function ModalKoreksiLebih({
  open,
  onClose,
  onConfirm,
  qtyLebih,
  tahapSaatIni,
}: ModalKoreksiLebihProps) {
  const [alasan, setAlasan] = useState<'lebih_cutting' | 'koreksi_tahap_sebelumnya' | 'lainnya' | ''>('');
  const [catatanText, setCatatanText] = useState('');

  const canSubmit = alasan && (alasan !== 'lainnya' || catatanText.trim().length > 0);

  const handleClose = () => {
    setAlasan('');
    setCatatanText('');
    onClose();
  };

  const handleSubmit = () => {
    if (!alasan) return;
    onConfirm({
      alasanLebih: alasan,
      alasanLebihText: alasan === 'lainnya' ? catatanText : undefined,
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className={styles.container}>
        <Heading level={4}>QTY Lebih — Ajukan Approval</Heading>

        <div className={styles.infoBox} data-type="danger">
          <span>🔴 QTY melebihi target sebanyak <strong>{qtyLebih} pcs</strong></span>
          <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.8 }}>
            QTY di sistem tetap sesuai PO sampai Owner menyetujui permintaan ini.
          </p>
        </div>

        <div className={styles.field}>
          <Label>Alasan QTY Lebih <span className={styles.req}>*</span></Label>
          <select
            className={styles.select}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value as typeof alasan)}
          >
            <option value="">-- Pilih alasan --</option>
            <option value="lebih_cutting">Lebih Cutting (cutting potong lebih banyak)</option>
            <option value="koreksi_tahap_sebelumnya">Koreksi dari Tahap Sebelumnya</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        {alasan === 'lainnya' && (
          <div className={styles.field}>
            <Label>Keterangan <span className={styles.req}>*</span></Label>
            <textarea
              className={styles.textarea}
              value={catatanText}
              onChange={(e) => setCatatanText(e.target.value)}
              placeholder="Jelaskan alasan QTY lebih..."
              rows={3}
            />
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            Ajukan Approval
          </Button>
        </div>
      </div>
    </Modal>
  );
}
