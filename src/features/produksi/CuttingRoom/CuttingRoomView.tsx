'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import { usePOStore } from '@/stores/usePOStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import BarcodeVisual from '../InputPO/BarcodeVisual';
import { POItem } from '@/types';
import styles from './CuttingRoomView.module.css';

interface CuttingQueueItem extends POItem {
  nomorPO: string;
  artikelNama: string;
  selected: boolean;
}

export default function CuttingRoomView() {
  const { poList, updateItemCuttingStatus } = usePOStore();
  const { model, warna, sizes } = useMasterStore();
  const { bundles } = useBundleStore();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<'spk' | 'barcode' | null>(null);
  const [printMode, setPrintMode] = useState<'spk' | 'barcode' | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handlePrint = (mode: 'spk' | 'barcode') => {
    if (selectedIds.length === 0) return;
    
    if (mode === 'spk') {
      selectedIds.forEach(id => {
        updateItemCuttingStatus(id, 'started');
      });
    }

    setPreviewMode(null);
    setPrintMode(mode);
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (mode === 'spk') {
          setSelectedIds([]);
        }
        setPrintMode(null);
      }, 500);
    }, 100);
  };

  const bundlesToPrint = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const selectedItems = queue.filter(q => selectedIds.includes(q.id));
    
    return bundles.filter(b => {
      const matchPo = selectedItems.find(i => i.poId === b.po);
      if (!matchPo) return false;
      return (
        matchPo.modelId === b.model &&
        matchPo.warnaId === b.warna &&
        matchPo.sizeId === b.size
      );
    });
  }, [bundles, selectedIds, queue]);

  const columns: Column<CuttingQueueItem>[] = [
    { 
      key: 'selected', 
      header: '✅', 
      render: (v: any, row: CuttingQueueItem) => (
        <input 
          type="checkbox" 
          checked={v as boolean} 
          onChange={() => toggleSelect(row.id)}
          className={styles.checkbox}
        />
      )
    },
    { key: 'nomorPO', header: 'Nomor PO', render: (v: any) => <span className={styles.poBadge}>{v}</span> },
    { key: 'artikelNama', header: 'Artikel / Size' },
    { key: 'qty', header: 'Target QTY', render: (v: any) => <strong>{v} pcs</strong> },
    { key: 'jumlahBundle', header: 'Bundle', render: (v: any, row: CuttingQueueItem) => `${v} bdl (@${row.qtyPerBundle})` },
    { 
      key: 'statusCutting', 
      header: 'Status', 
      render: (v: any) => (
        <Badge variant={v === 'started' ? 'info' : 'warning'}>
          {v === 'started' ? 'Sedang Dipotong' : 'Menunggu'}
        </Badge>
      )
    }
  ];

  const spkContent = (
    <div className={styles.printableArea} id="print-area">
      <div className={styles.printHeader}>
        <div className={styles.brandTitle}>STITCHLYX.SYNCORE</div>
        <div className={styles.docTitle}>SURAT PERINTAH KERJA (SPK) CUTTING</div>
        <div className={styles.printMeta}>
          <span>Tanggal: {isMounted ? new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }) : ''}</span>
          <span>ID Dokumen: SPK-{isMounted ? Date.now().toString().slice(-6) : ''}</span>
        </div>
      </div>

      <table className={styles.printTable}>
        <thead>
          <tr>
            <th rowSpan={2}>No</th>
            <th rowSpan={2}>Kode Barcode</th>
            <th rowSpan={2}>Artikel</th>
            <th rowSpan={2}>Size</th>
            <th rowSpan={2}>Warna</th>
            <th colSpan={2} className={styles.center}>Target (Generate)</th>
            <th colSpan={2} className={styles.center}>Aktual (Kosongkan)</th>
            <th rowSpan={2}>Pemakaian Bahan</th>
            <th rowSpan={2}>Keterangan</th>
          </tr>
          <tr>
            <th className={styles.center}>QTY Order</th>
            <th className={styles.center}>Bundle</th>
            <th className={styles.center}>QTY real</th>
            <th className={styles.center}>Bundle</th>
          </tr>
        </thead>
        <tbody>
          {queue.filter(i => selectedIds.includes(i.id)).map((item, index) => {
            const modelName = model.find(m => m.id === item.modelId)?.nama || item.modelId;
            const sizeName = (sizes as any[]).find(s => s.id === item.sizeId)?.nama || item.sizeId;
            const warnaName = warna.find(w => w.id === item.warnaId)?.nama || item.warnaId;

            return (
              <tr key={item.id}>
                <td className={styles.center}>{index + 1}</td>
                <td className={styles.bold}>{item.nomorPO}</td>
                <td>{modelName}</td>
                <td className={styles.center}>{sizeName}</td>
                <td className={styles.center}>{warnaName}</td>
                <td className={styles.center}>{item.qty}</td>
                <td className={styles.center}>{item.jumlahBundle}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={styles.validationGrid}>
        <div className={styles.signBox}>
          <p>Bagian Produksi / Admin</p>
          <div className={styles.signSpace}></div>
          <p className={styles.bold}>( ________________ )</p>
        </div>
        <div className={styles.signBox}>
          <p>Kepala Tim Cutting</p>
          <div className={styles.signSpace}></div>
          <p className={styles.bold}>( ________________ )</p>
        </div>
        <div className={styles.signBox}>
          <p>Mengetahui</p>
          <div className={styles.signSpace}></div>
          <p className={styles.bold}>( ________________ )</p>
        </div>
      </div>

      <div className={styles.printFooter}>
         <p>Catatan: Harap lampirkan lembar ini saat penyerahan hasil potong ke bagian Jahit.</p>
         <p>Dicetak otomatis oleh Stitchlyx Syncore GOS pada {isMounted ? new Date().toLocaleString('id-ID') : ''}</p>
      </div>
    </div>
  );

  const barcodeContent = (
    <div className={styles.printableArea} id="print-area">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {bundlesToPrint.map(b => (
          <BarcodeVisual key={b.barcode} bundle={b} />
        ))}
      </div>
    </div>
  );

  return (
    <PageWrapper 
      title="Cutting Room (Antrian Potong)" 
      subtitle="Pilih artikel untuk mulai dipotong dan cetak SPK"
      action={
        <div className={styles.actions} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
           {selectedIds.length > 0 && (
             <>
               <Button variant="secondary" onClick={() => setPreviewMode('spk')}>
                 👁️ Preview SPK
               </Button>
               <Button variant="primary" onClick={() => handlePrint('spk')}>
                 🖨️ Cetak SPK Mulai Potong
               </Button>
               <Button variant="secondary" onClick={() => setPreviewMode('barcode')}>
                 👁️ Preview Barcode
               </Button>
               <Button variant="primary" onClick={() => handlePrint('barcode')}>
                 🖨️ Cetak Label Barcode
               </Button>
             </>
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

        {previewMode && isMounted && (
          <Modal open={true} onClose={() => setPreviewMode(null)} size="xl">
            <ModalHeader 
              title={previewMode === 'spk' ? "Preview Visual SPK Cutting" : "Preview Visual Label Barcode"} 
              onClose={() => setPreviewMode(null)} 
            />
            <ModalBody>
              <div className="previewWrapper" style={{ background: 'white', color: 'black', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
                <div style={{ fontFamily: 'Arial, sans-serif' }}>
                  {previewMode === 'spk' ? spkContent : barcodeContent}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setPreviewMode(null)}>Tutup Preview</Button>
              <Button variant="primary" onClick={() => handlePrint(previewMode)}>
                Mulai Cetak Sesungguhnya
              </Button>
            </ModalFooter>
          </Modal>
        )}

        {isMounted && printMode && typeof document !== 'undefined'
          ? createPortal(printMode === 'spk' ? spkContent : barcodeContent, document.body)
          : null}
      </div>
    </PageWrapper>
  );
}
