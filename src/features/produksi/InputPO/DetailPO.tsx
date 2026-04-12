import React, { useState } from 'react';
import { usePOStore } from '@/stores/usePOStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { useMasterStore } from '@/stores/useMasterStore';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import { Heading, MonoText } from '@/components/atoms/Typography';
import TiketBarcode from './TiketBarcode';
import styles from './DetailPO.module.css';

interface DetailPOProps {
  poId: string;
}

import { useToast } from '@/components/molecules/Toast';

export default function DetailPO({ poId }: DetailPOProps) {
  const { getPOById, removePO } = usePOStore();
  const { getBundlesByPO, removeBundlesByPO } = useBundleStore();
  const { klien, model, warna, sizes } = useMasterStore();
  const { success, error, warning } = useToast();
  
  const [showPrint, setShowPrint] = useState(false);

  const po = getPOById(poId);
  const bundles = getBundlesByPO(poId);

  if (!po) return <div>PO not found</div>;

  const hasStartedProduction = bundles.some(b => 
    Object.values(b.statusTahap).some(s => s.status === 'selesai' || s.qtySelesai > 0)
  );

  const handleDelete = () => {
    if (hasStartedProduction) {
      error('Gagal Menghapus', 'PO ini sudah memulai proses produksi. Data yang sudah berjalan tidak dapat dihapus.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus PO ${po.nomorPO}? Tindakan ini akan menghapus semua data bundle terkait.`)) {
      removePO(poId);
      // We assume removeBundlesByPO exists or we'll add it
      removeBundlesByPO(poId);
      success('PO Dihapus', `Purchase Order ${po.nomorPO} telah berhasil dihapus.`);
    }
  };

  const clientName = klien.find(k => k.id === po.klienId)?.nama || po.klienId;

  // Flatten logic to group per item for summary table
  const itemSummary = po.items.map((item: any) => {
    return {
      id: item.id,
      model: model.find(m => m.id === item.modelId)?.nama,
      warna: warna.find(w => w.id === item.warnaId)?.nama,
      size: sizes.find((s: any) => s.id === item.sizeId)?.nama,
      qty: item.qty,
      isiBundle: item.qtyPerBundle,
      totalBundle: item.jumlahBundle
    };
  });

  const columns: Column<any>[] = [
    { key: 'model', header: 'Model' },
    { key: 'warna', header: 'Warna' },
    { key: 'size', header: 'Size' },
    { key: 'qty', header: 'QTY Order' },
    { key: 'isiBundle', header: 'Isi/Bundle' },
    { key: 'totalBundle', header: 'Total Bundle' }
  ];

  if (showPrint) {
    return <TiketBarcode bundles={bundles} onBack={() => setShowPrint(false)} />;
  }

  return (
    <div className={styles.container}>
      <Panel title="Detail Header">
        <div className={styles.header}>
          <div>
            <Heading level={3}>{po.nomorPO}</Heading>
            <p>Klien: {clientName} | Tanggal: {po.tanggalInput}</p>
          </div>
          <div>
            <Button variant="danger" size="sm" onClick={handleDelete} className={styles.deleteBtn}>
              🗑️ Hapus PO
            </Button>
            <Button variant="primary" onClick={() => setShowPrint(true)}>
              🖨️ Cetak Barcode ({bundles.length} Tiket)
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Daftar Artikel">
        <DataTable columns={columns} data={itemSummary} keyField="id" />
      </Panel>
    </div>
  );
}
