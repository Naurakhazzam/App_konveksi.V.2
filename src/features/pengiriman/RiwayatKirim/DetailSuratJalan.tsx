import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { SuratJalan, SuratJalanItem } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import styles from './DetailSuratJalan.module.css';

interface DetailSuratJalanProps {
  sj: SuratJalan;
  onClose: () => void;
  onUpdateStatus: (status: SuratJalan['status']) => void;
}

export default function DetailSuratJalan({ sj, onClose, onUpdateStatus }: DetailSuratJalanProps) {
  const { klien, model, warna, sizes } = useMasterStore();

  const columns: Column<SuratJalanItem>[] = [
    { key: 'skuKlien', header: 'SKU Klien' },
    { key: 'poId', header: 'No. PO' },
    { 
      key: 'modelId', 
      header: 'Model', 
      render: (v) => model.find(m => m.id === v)?.nama || v 
    },
    { 
      key: 'warnaId', 
      header: 'Warna', 
      render: (v) => warna.find(w => w.id === v)?.nama || v 
    },
    { 
      key: 'sizeId', 
      header: 'Size', 
      render: (v) => (sizes as any[]).find(s => s.id === v)?.nama || v 
    },
    { key: 'qty', header: 'QTY', render: (v) => <strong>{v} pcs</strong> }
  ];

  const clientName = klien.find(k => k.id === sj.klienId)?.nama || sj.klienId;

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <ModalHeader title={`Detail Surat Jalan: ${sj.nomorSJ}`} onClose={onClose} />
      <ModalBody>
        <div className={styles.container}>
          <div className={styles.headerInfo}>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}><span>Klien:</span> <strong>{clientName}</strong></div>
              <div className={styles.metaItem}><span>Tanggal:</span> {new Date(sj.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
              <div className={styles.metaItem}><span>Pengirim:</span> {sj.pengirim || '-'}</div>
              <div className={styles.metaItem}><span>Status:</span> <Badge variant={sj.status === 'diterima' ? 'success' : 'info'}>{sj.status.toUpperCase()}</Badge></div>
            </div>
            {sj.catatan && (
              <div className={styles.catatan}>
                <span>Catatan:</span>
                <p>{sj.catatan}</p>
              </div>
            )}
          </div>

          <div className={styles.tableTitle}>Daftar Bundel ({sj.items.length} Bundel)</div>
          <DataTable columns={columns} data={sj.items} keyField="id" />
        </div>
      </ModalBody>
      <ModalFooter>
        <div className={styles.footerPrint}>
          <Button variant="ghost" onClick={() => window.print()}>
            🖨️ Cetak Surat Jalan
          </Button>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" onClick={onClose}>Tutup</Button>
        {sj.status === 'dikirim' && (
          <Button variant="primary" onClick={() => {
            if (confirm('Tandai bahwa pengiriman ini sudah diterima oleh klien?')) {
              onUpdateStatus('diterima');
              onClose();
            }
          }}>
            ✅ Konfirmasi Diterima
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
