import React from 'react';
import { Modal, ModalHeader, ModalBody } from '@/components/organisms/Modal';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import { TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';

interface FlowDetailModalProps {
  open: boolean;
  onClose: () => void;
  bundles: Bundle[];
  stage: string;
  type: string;
}

export default function FlowDetailModal({ open, onClose, bundles, stage, type }: FlowDetailModalProps) {
  const { model, warna, sizes, karyawan } = useMasterStore();

  const title = stage === 'antri' ? 'Antrian Cutting' : 
                stage === 'kirim' ? 'Siap Kirim (Packing Selesai)' : 
                `${TAHAP_LABEL[stage as TahapKey]} - ${type === 'selesai' ? 'Selesai/Menunggu' : 'Sedang Dikerjakan'}`;

  const columns: Column<Bundle>[] = [
    { key: 'po', header: 'No. PO', render: (v) => <strong>{v}</strong> },
    { key: 'barcode', header: 'Barcode', render: (v) => <code style={{ fontSize: '11px' }}>{v}</code> },
    { key: 'model', header: 'Model', render: (v) => model.find(m => m.id === v)?.nama || v },
    { key: 'warna', header: 'Warna', render: (v) => warna.find(w => w.id === v)?.nama || v },
    { key: 'size', header: 'Size', render: (v) => (sizes as any[]).find(s => s.id === v)?.nama || v },
    { key: 'qtyBundle', header: 'QTY (pcs)', align: 'center' },
    { 
      key: 'statusTahap', 
      header: 'Pengerja', 
      render: (st: any) => {
        if (stage === 'antri' || stage === 'kirim') return '-';
        const s = st[stage as TahapKey];
        if (!s?.karyawan) return '-';
        return karyawan.find(k => k.id === s.karyawan)?.nama || s.karyawan;
      }
    }
  ];

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Menampilkan {bundles.length} bundel yang berada di status ini.
          </p>
          <DataTable columns={columns} data={bundles} keyField="barcode" />
        </div>
      </ModalBody>
    </Modal>
  );
}
