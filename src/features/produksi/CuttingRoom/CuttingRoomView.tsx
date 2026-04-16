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
import TextInput from '@/components/atoms/Input/TextInput';
import Select from '@/components/atoms/Select/Select';
import { POItem } from '@/types';
import styles from './CuttingRoomView.module.css';

interface CuttingQueueItem {
  barcode: string;
  nomorPO: string;
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qtyBundle: number;
  skuKlien: string;
  statusCutting: string; // From bundle.statusTahap.cutting.status
  selected: boolean;
}

export default function CuttingRoomView() {
  const { poList } = usePOStore();
  const { model, warna, sizes } = useMasterStore();
  const { bundles, updateStatusTahap } = useBundleStore();
  
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<'spk' | 'barcode' | null>(null);
  const [printMode, setPrintMode] = useState<'spk' | 'barcode' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const queue = useMemo(() => {
    // Flatten bundle list into queue items
    const items: CuttingQueueItem[] = bundles
      .filter(b => b.statusTahap.cutting.status !== 'selesai')
      .map(b => {
        const po = poList.find(p => p.id === b.po);
        return {
          barcode: b.barcode,
          nomorPO: po?.nomorPO || b.po,
          poId: b.po,
          modelId: b.model,
          warnaId: b.warna,
          sizeId: b.size,
          qtyBundle: b.qtyBundle,
          skuKlien: b.skuKlien || '',
          statusCutting: b.statusTahap.cutting.status || 'waiting',
          selected: selectedBarcodes.includes(b.barcode)
        };
      });

    // Apply Filters
    return items.filter(item => {
      const matchSearch = 
        item.nomorPO.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || item.statusCutting === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bundles, poList, selectedBarcodes, searchQuery, filterStatus]);

  const toggleSelect = (barcode: string) => {
    setSelectedBarcodes(prev => 
      prev.includes(barcode) ? prev.filter(x => x !== barcode) : [...prev, barcode]
    );
  };

  const handlePrint = async (mode: 'spk' | 'barcode') => {
    if (selectedBarcodes.length === 0) return;
    
    if (mode === 'spk') {
      // Mark selected bundles as 'started' (terima)
      for (const barcode of selectedBarcodes) {
        await updateStatusTahap(barcode, 'cutting', { status: 'terima' });
      }
    }

    setPreviewMode(null);
    setPrintMode(mode);
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (mode === 'spk') {
          setSelectedBarcodes([]);
        }
        setPrintMode(null);
      }, 500);
    }, 100);
  };

  const bundlesToPrint = useMemo(() => {
    return bundles.filter(b => selectedBarcodes.includes(b.barcode));
  }, [bundles, selectedBarcodes]);

  const columns: Column<CuttingQueueItem>[] = [
    { 
      key: 'selected', 
      header: '✅', 
      render: (v: any, row: CuttingQueueItem) => (
        <input 
          type="checkbox" 
          checked={v as boolean} 
          onChange={() => toggleSelect(row.barcode)}
          className={styles.checkbox}
        />
      )
    },
    { 
      key: 'barcode', 
      header: 'KODE UNIK', 
      render: (v) => <code style={{ fontSize: '11px', fontWeight: 'bold' }}>{v}</code>
    },
    { 
      key: 'nomorPO', 
      header: 'Nomor PO', 
      render: (v: any, row: any) => {
        const isLong = v.length > 15 && v.startsWith('PO-IMP');
        let display = v;
        if (isLong) {
          const sorted = [...poList].sort((a, b) => new Date(a.tanggalInput).getTime() - new Date(b.tanggalInput).getTime());
          const idx = sorted.findIndex(p => p.id === row.poId);
          display = `PO-${String(idx + 1).padStart(3, '0')}`;
        }
        return <span title={v} className={styles.poBadge} style={{ cursor: 'help' }}>{display}</span>;
      }
    },
    { 
      key: 'modelId', 
      header: 'Model', 
      render: (id) => {
        const item = model.find(m => m.id === id);
        return item?.nama || id;
      }
    },
    { 
      key: 'warnaId', 
      header: 'Warna', 
      render: (id) => {
        const item = warna.find(w => w.id === id);
        return item?.nama || id;
      }
    },
    { 
      key: 'sizeId', 
      header: 'Size', 
      render: (id) => {
        const item = sizes.find(s => s.id === id);
        return item?.nama || id;
      }
    },
    { key: 'qtyBundle', header: 'QTY', render: (v: any) => <strong>{v} pcs</strong> },
    { 
      key: 'statusCutting', 
      header: 'Status', 
      render: (v: any) => (
        <Badge variant={v === 'terima' || v === 'started' ? 'info' : 'warning'}>
          {v === 'terima' || v === 'started' ? 'Sedang Dipotong' : 'Menunggu'}
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
            <th rowSpan={2}>Kode PO</th>
            <th rowSpan={2}>KODE UNIK (Range)</th>
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
          {groupSelectedForSPK(queue.filter(i => selectedBarcodes.includes(i.barcode))).map((g, index) => {
            const modelName = model.find(m => m.id === g.modelId)?.nama || g.modelId;
            const sizeName = (sizes as any[]).find(s => s.id === g.sizeId)?.nama || g.sizeId;
            const warnaName = warna.find(w => w.id === g.warnaId)?.nama || g.warnaId;

            return (
              <tr key={index}>
                <td className={styles.center}>{index + 1}</td>
                <td className={styles.bold}>{g.nomorPO}</td>
                <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{g.range}</td>
                <td>{modelName}</td>
                <td className={styles.center}>{sizeName}</td>
                <td className={styles.center}>{warnaName}</td>
                <td className={styles.center}>{g.totalQty}</td>
                <td className={styles.center}>{g.count}</td>
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
           {selectedBarcodes.length > 0 && (
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
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label>Cari Nomor PO / KODE UNIK</label>
            <TextInput 
              placeholder="Contoh: PO-001 atau bdl001..." 
              value={searchQuery} 
              onChange={setSearchQuery} 
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Filter Status</label>
            <Select 
              value={filterStatus} 
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'waiting', label: 'Menunggu' },
                { value: 'terima', label: 'Sedang Dipotong' },
              ]}
            />
          </div>
        </div>

        <Panel title="Antrian Cutting">
          <DataTable 
            columns={columns} 
            data={queue} 
            keyField="barcode" 
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

// Logic for SPK grouping (Option 2)
function groupSelectedForSPK(selectedBundles: CuttingQueueItem[]) {
  const groups: Record<string, {
    nomorPO: string;
    modelId: string;
    warnaId: string;
    sizeId: string;
    totalQty: number;
    count: number;
    barcodes: string[];
    poId: string;
  }> = {};

  selectedBundles.forEach(b => {
    // Unique key per article/item
    const key = `${b.poId}-${b.modelId}-${b.warnaId}-${b.sizeId}`;
    if (!groups[key]) {
      groups[key] = {
        nomorPO: b.nomorPO,
        modelId: b.modelId,
        warnaId: b.warnaId,
        sizeId: b.sizeId,
        totalQty: 0,
        count: 0,
        barcodes: [],
        poId: b.poId
      };
    }
    groups[key].totalQty += b.qtyBundle;
    groups[key].count += 1;
    groups[key].barcodes.push(b.barcode);
  });

  return Object.values(groups).map(g => {
    // Extract range info from full barcodes as requested ("jangan sepotong")
    const sorted = g.barcodes.sort();
    const range = sorted.length > 1 
      ? `${sorted[0]} s/d ${sorted[sorted.length-1]}`
      : sorted[0];
    
    return { ...g, range };
  });
}
