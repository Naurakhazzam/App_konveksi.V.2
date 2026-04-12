import React, { useState } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { PurchaseOrder, Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import ProgressTimeline from './ProgressTimeline';
import styles from './MonitoringPerArtikel.module.css';

interface MonitoringPerArtikelProps {
  poList: PurchaseOrder[];
  bundles: Bundle[];
}

export default function MonitoringPerArtikel({ poList, bundles }: MonitoringPerArtikelProps) {
  const { model, warna, sizes } = useMasterStore();
  const [selectedPO, setSelectedPO] = useState<string>('');

  // Get articles data
  const filteredPOList = selectedPO ? poList.filter(p => p.id === selectedPO) : poList;
  
  const articleData: any[] = [];
  filteredPOList.forEach(po => {
    po.items.forEach(item => {
      articleData.push({
        id: `${po.id}-${item.id}`,
        poId: po.id,
        nomorPO: po.nomorPO,
        modelId: item.modelId,
        warnaId: item.warnaId,
        sizeId: item.sizeId,
        qtyTarget: item.qty,
        bundleCount: item.jumlahBundle,
        qtySelesai: bundles
          .filter(b => b.po === po.id && b.model === item.modelId && b.warna === item.warnaId && b.size === item.sizeId)
          .reduce((acc, curr) => acc + (curr.statusTahap.packing.status === 'selesai' ? curr.statusTahap.packing.qtySelesai : 0), 0)
      });
    });
  });

  const columns: Column<any>[] = [
    { key: 'nomorPO', header: 'Nomor PO' },
    { key: 'modelId', header: 'Model', render: (val) => model.find(m => m.id === val)?.nama || val },
    { key: 'warnaId', header: 'Warna', render: (val) => warna.find(w => w.id === val)?.nama || val },
    { key: 'sizeId', header: 'Size', render: (val) => (sizes as any[]).find(s => s.id === val)?.nama || val },
    { key: 'qtyTarget', header: 'Target (pcs)', align: 'center' },
    { key: 'bundleCount', header: 'Bundel', align: 'center' },
    { 
      key: 'progress', 
      header: 'Jalur Produksi', 
      render: (_, row) => (
        <ProgressTimeline 
          bundles={bundles} 
          poId={row.poId} 
          modelId={row.modelId} 
          warnaId={row.warnaId} 
          sizeId={row.sizeId} 
        />
      )
    },
    { key: 'qtySelesai', header: 'Selesai (pcs)', align: 'center' },
    { 
      key: 'sisa', 
      header: 'Sisa', 
      render: (_, row) => {
        const sisa = row.qtyTarget - row.qtySelesai;
        return <span style={{ color: sisa > 0 ? 'var(--color-danger)' : 'var(--color-green)', fontWeight: 700 }}>{sisa}</span>;
      }
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.filter}>
        <label>Filter PO:</label>
        <select value={selectedPO} onChange={(e) => setSelectedPO(e.target.value)} className={styles.select}>
          <option value="">Semua PO Aktif</option>
          {poList.map(p => (
            <option key={p.id} value={p.id}>{p.nomorPO}</option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={articleData} keyField="id" />
    </div>
  );
}
