'use client';

import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { usePOStore } from '@/stores/usePOStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { POItem, PurchaseOrder } from '@/types';
import BarcodeVisual from '../InputPO/BarcodeVisual';
import styles from './CuttingRoomView.module.css';

interface CuttingQueueItem extends POItem {
  nomorPO: string;
  artikelNama: string;
  selected?: boolean;
}

export default function CuttingRoomView() {
  const { poList, updateItemCuttingStatus } = usePOStore();
  const { model, warna, sizes } = useMasterStore();
  const { bundles } = useBundleStore();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. Flatten PO items that are 'waiting' or 'started'
  const queue = useMemo(() => {
    const items: CuttingQueueItem[] = [];
    poList.forEach(po => {
      po.items.forEach(item => {
        if (item.statusCutting !== 'finished') {
          const m = model.find(mod => mod.id === item.modelId)?.nama || item.modelId;
          const w = warna.find(wor => wor.id === item.warnaId)?.nama || item.warnaId;
          const s = (sizes as any[]).find(sz => sz.id === item.sizeId)?.nama || item.sizeId;
          
          items.push({
            ...item,
            nomorPO: po.nomorPO,
            artikelNama: `${m} - ${w} - ${s}`,
            selected: selectedIds.includes(item.id)
          });
        }
      });
    });
    return items;
  }, [poList, model, warna, sizes, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleMulaiPotong = () => {
    if (selectedIds.length === 0) return;
    
    // 1. Update status to 'started'
    selectedIds.forEach(id => {
      updateItemCuttingStatus(id, 'started');
    });

    // 2. Trigger Print
    window.print();
    
    // 3. Clear selection
    setSelectedIds([]);
  };

  const bundlesToPrint = useMemo(() => {
    const selectedItems = queue.filter(i => selectedIds.includes(i.id));
    return bundles.filter(b => selectedItems.some(i => b.po === i.poId && b.model === i.modelId && b.warna === i.warnaId && b.size === i.sizeId));
  }, [bundles, queue, selectedIds]);

  const columns: Column<CuttingQueueItem>[] = [
    { 
      key: 'selected', 
      header: '', 
      render: (_, row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)} 
          onChange={() => toggleSelect(row.id)}
          className={styles.checkbox}
        />
      ),
      width: '40px'
    },
    { key: 'nomorPO', header: 'No. PO', render: (v) => <code className={styles.poBadge}>{v}</code> },
    { key: 'artikelNama', header: 'Artikel / Size' },
    { key: 'qty', header: 'Target QTY', render: (v) => <strong>{v} pcs</strong> },
    { key: 'jumlahBundle', header: 'Bundle', render: (v, row) => `${v} bdl (@${row.qtyPerBundle})` },
    { 
      key: 'statusCutting', 
      header: 'Status', 
      render: (v) => (
        <Badge variant={v === 'started' ? 'info' : 'warning'}>
          {v === 'started' ? 'Sedang Dipotong' : 'Menunggu'}
        </Badge>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Cutting Room (Antrian Potong)" 
      subtitle="Pilih artikel untuk mulai dipotong dan cetak SPK"
      action={
        <div className={styles.actions}>
           {selectedIds.length > 0 && (
             <Button variant="primary" onClick={handleMulaiPotong}>
               🖨️ Cetak SPK & Mulai Potong ({selectedIds.length})
             </Button>
           )}
        </div>
      }
    >
      <div className={styles.container}>
        <Panel title="Antrian Cutting">
          <DataTable 
            columns={columns} 
            data={queue} 
            keyField="id" 
            emptyMessage="Tidak ada antrian cutting saat ini."
            reverse={true}
          />
        </Panel>

        {/* Hidden Printable SPK */}
        <div className={styles.printableArea} id="print-area">
          <div className={styles.printHeader}>
            <h1>SURAT PERINTAH KERJA (SPK) CUTTING</h1>
            <p>Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table className={styles.printTable}>
            <thead>
              <tr>
                <th>No. PO</th>
                <th>Artikel Details</th>
                <th>Target QTY</th>
                <th>Bundle</th>
                <th>Paraf Admin</th>
                <th>Paraf Cutting</th>
              </tr>
            </thead>
            <tbody>
              {queue.filter(i => selectedIds.includes(i.id)).map(item => (
                <tr key={item.id}>
                  <td>{item.nomorPO}</td>
                  <td>{item.artikelNama}</td>
                  <td>{item.qty} pcs</td>
                  <td>{item.jumlahBundle} bdl</td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.printFooter}>
             <p>* Harap laporkan input pemakaian bahan setelah cutting selesai.</p>
          </div>

          {bundlesToPrint.length > 0 && (
            <div style={{ pageBreakBefore: 'always', paddingTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {bundlesToPrint.map(b => (
                  <BarcodeVisual key={b.barcode} bundle={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
