import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import NumberInput from '@/components/atoms/Input/NumberInput';
import TextInput from '@/components/atoms/Input/TextInput';
import Button from '@/components/atoms/Button';
import OwnerCodeModal from '@/components/molecules/OwnerCodeModal';
import { TahapKey, TAHAP_LABEL } from '@/lib/utils/production-helpers';
import styles from './ModalQtySelesai.module.css';

interface ModalQtySelesaiProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (qtySelesai: number, alasan: string, needsKoreksi: boolean) => void;
  qtyTerima: number;
  tahap: TahapKey;
  title?: string;
}

export default function ModalQtySelesai({ open, onClose, onConfirm, qtyTerima, tahap, title }: ModalQtySelesaiProps) {
  const [qty, setQty] = useState<number | ''>('');
  const [alasan, setAlasan] = useState('');
  const [showOwnerAuth, setShowOwnerAuth] = useState(false);

  const qtyNum = Number(qty) || 0;
  const diff = qtyNum - qtyTerima;

  const getStatus = () => {
    if (!qty) return null;
    if (diff === 0) return 'ok';
    if (diff < 0) return 'kurang';
    return 'lebih';
  };

  const status = getStatus();

  const handleClose = () => {
    setQty('');
    setAlasan('');
    setShowOwnerAuth(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!qty) return;
    if (status === 'kurang' && !alasan.trim()) {
      alert('Wajib mengisi alasan jika QTY kurang dari target');
      return;
    }
    if (status === 'lebih') {
      setShowOwnerAuth(true);
      return;
    }
    onConfirm(qtyNum, alasan, false);
    handleClose();
  };

  const handleOwnerSuccess = () => {
    setShowOwnerAuth(false);
    onConfirm(qtyNum, alasan, true);
    handleClose();
  };

  return (
    <>
      <Modal open={open && !showOwnerAuth} onClose={handleClose} size="sm">
        <div className={styles.container}>
          <Heading level={4}>{title || 'Input QTY Selesai'}</Heading>
          <Label color="sub">Tahap: {TAHAP_LABEL[tahap]}</Label>

          <div className={styles.target}>
            <span>QTY Terima (Target)</span>
            <strong>{qtyTerima} pcs</strong>
          </div>

          <div className={styles.field}>
            <Label>QTY Selesai <span className={styles.req}>*</span></Label>
            <NumberInput value={qty} onChange={(v) => setQty(v as number)} />
          </div>

          {status && (
            <div className={styles.statusBox} data-status={status}>
              {status === 'ok' && <span>✅ Sesuai target</span>}
              {status === 'kurang' && (
                <div>
                  <span>⚠️ Kurang {Math.abs(diff)} pcs dari target</span>
                  <div className={styles.alasanField}>
                    <Label>Alasan / Keterangan <span className={styles.req}>*</span></Label>
                    <TextInput
                      value={alasan}
                      onChange={setAlasan}
                      placeholder="Misal: 2 pcs cacat jahitan..."
                    />
                  </div>
                </div>
              )}
              {status === 'lebih' && (
                <span>🔴 Melebihi target (+{diff} pcs) — Membutuhkan otorisasi Owner</span>
              )}
            </div>
          )}

          <div className={styles.footer}>
            <Button variant="ghost" onClick={handleClose}>Batal</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!qty}
            >
              {status === 'lebih' ? '🔒 Minta Otorisasi' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      <OwnerCodeModal
        open={showOwnerAuth}
        onClose={() => setShowOwnerAuth(false)}
        onSuccess={handleOwnerSuccess}
        title="Otorisasi QTY Melebihi Target"
        description={`QTY Selesai (${qtyNum}) melebihi QTY Terima (${qtyTerima}). Diperlukan izin Owner untuk menyimpan.`}
      />
    </>
  );
}
