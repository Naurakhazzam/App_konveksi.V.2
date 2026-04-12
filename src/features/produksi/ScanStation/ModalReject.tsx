import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import NumberInput from '@/components/atoms/Input/NumberInput';
import TextInput from '@/components/atoms/Input/TextInput';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore, RejectRecord } from '@/stores/useBundleStore';
import { TahapKey, TAHAP_LABEL } from '@/lib/utils/production-helpers';
import styles from './ModalReject.module.css';

interface ModalRejectProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  tahap: TahapKey;
  qtyMax: number;
}

export default function ModalReject({ open, onClose, barcode, tahap, qtyMax }: ModalRejectProps) {
  const { jenisReject } = useMasterStore();
  const { addRejectRecord } = useBundleStore();
  const [jenisId, setJenisId] = useState('');
  const [qty, setQty] = useState<number | ''>('');
  const [catatan, setCatatan] = useState('');

  const handleClose = () => {
    setJenisId('');
    setQty('');
    setCatatan('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisId) return alert('Pilih jenis reject');
    if (!qty || Number(qty) <= 0) return alert('QTY reject harus lebih dari 0');
    if (Number(qty) > qtyMax) return alert(`QTY reject tidak boleh lebih dari ${qtyMax}`);

    const record: RejectRecord = {
      id: `REJ-${Date.now()}`,
      barcode,
      tahap,
      jenisRejectId: jenisId,
      qty: Number(qty),
      catatan,
      waktu: new Date().toISOString(),
    };
    addRejectRecord(record);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit} className={styles.container}>
        <Heading level={4}>Catat Reject</Heading>
        <Label color="sub">Tahap: {TAHAP_LABEL[tahap]} | Bundle: {barcode}</Label>

        <div className={styles.field}>
          <Label>Jenis Reject <span className={styles.req}>*</span></Label>
          <select className={styles.select} value={jenisId} onChange={e => setJenisId(e.target.value)} required>
            <option value="">-- Pilih jenis --</option>
            {jenisReject.map(jr => (
              <option key={jr.id} value={jr.id}>{jr.nama}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <Label>QTY Reject <span className={styles.req}>*</span></Label>
          <NumberInput value={qty} onChange={(v) => setQty(v as number)} />
          <span className={styles.hint}>Maksimal: {qtyMax} pcs</span>
        </div>

        <div className={styles.field}>
          <Label>Catatan (opsional)</Label>
          <TextInput value={catatan} onChange={setCatatan} placeholder="Keterangan tambahan..." />
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={handleClose}>Batal</Button>
          <Button type="submit" variant="danger">Simpan Reject</Button>
        </div>
      </form>
    </Modal>
  );
}
