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
import TextInput from '@/components/atoms/Input/TextInput';
import BarcodeVisual from '../InputPO/BarcodeVisual';
import { Bundle } from '@/types';
import styles from './CuttingRoomView.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Type
// ─────────────────────────────────────────────────────────────────────────────

interface CuttingArticleItem {
  barcode: string;
  nomorPO: string;
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qtyBundle: number;
  skuKlien: string;
  bundle: Bundle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Komponen
// ─────────────────────────────────────────────────────────────────────────────

export default function CuttingRoomView() {
  const { poList, updateItemCuttingStatus } = usePOStore();
  const { model, warna, sizes } = useMasterStore();
  const { bundles, updateStatusTahap } = useBundleStore();

  const [activeTab, setActiveTab] = useState<'antrian' | 'cutting'>('antrian');
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<'spk' | 'barcode' | null>(null);
  const [printMode, setPrintMode] = useState<'spk' | 'barcode' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────

  const allQueueItems = useMemo<CuttingArticleItem[]>(() => {
    return bundles.map(b => {
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
        bundle: b,
      };
    });
  }, [bundles, poList]);

  // Tab Antrian: bundle belum dipilih untuk dipotong (status null)
  const queueAntrian = useMemo(() => {
    return allQueueItems.filter(item =>
      item.bundle.statusTahap.cutting.status === null &&
      item.nomorPO.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allQueueItems, searchQuery]);

  // Tab Cutting: bundle sedang dipotong (status 'terima')
  const queueCutting = useMemo(() => {
    return allQueueItems.filter(item =>
      item.bundle.statusTahap.cutting.status === 'terima' &&
      item.nomorPO.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allQueueItems, searchQuery]);

  // Bersihkan selectedBarcodes yang sudah tidak ada di antrian
  useEffect(() => {
    const availableBarcodes = queueAntrian.map(i => i.barcode);
    setSelectedBarcodes(prev => {
      const filtered = prev.filter(b => availableBarcodes.includes(b));
      if (filtered.length === prev.length) return prev;
      return filtered;
    });
  }, [queueAntrian]);

  // ── Aksi ──────────────────────────────────────────────────────────────────

  const toggleSelect = (barcode: string) => {
    setSelectedBarcodes(prev =>
      prev.includes(barcode) ? prev.filter(x => x !== barcode) : [...prev, barcode]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBarcodes.length === queueAntrian.length) {
      setSelectedBarcodes([]);
    } else {
      setSelectedBarcodes(queueAntrian.map(i => i.barcode));
    }
  };

  const handlePrint = async (mode: 'spk' | 'barcode') => {
    if (selectedBarcodes.length === 0) return;

    if (mode === 'spk') {
      // Update bundle status ke 'terima' dan PO item ke 'started'
      for (const barcode of selectedBarcodes) {
        await updateStatusTahap(barcode, 'cutting', { status: 'terima' });

        const b = bundles.find(bx => bx.barcode === barcode);
        if (b) {
          const po = poList.find(p => p.id === b.po);
          const poItem = po?.items.find(
            i => i.modelId === b.model && i.warnaId === b.warna && i.sizeId === b.size
          );
          if (poItem && poItem.statusCutting === 'waiting') {
            await updateItemCuttingStatus(poItem.id, 'started');
          }
        }
      }
    }

    setPreviewMode(null);
    setPrintMode(mode);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (mode === 'spk') {
          setSelectedBarcodes([]);
          setActiveTab('cutting'); // Auto-pindah ke Tab Cutting
        }
        setPrintMode(null);
      }, 500);
    }, 100);
  };

  // ── Data Print ────────────────────────────────────────────────────────────

  const bundlesToPrint = useMemo(() => {
    return bundles.filter(b => selectedBarcodes.includes(b.barcode));
  }, [bundles, selectedBarcodes]);

  // ── Kolom Tabel ───────────────────────────────────────────────────────────

  const columnsAntrian: Column<CuttingArticleItem>[] = [
    {
      key: '_select' as any,
      header: '✓',
      width: '40px',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedBarcodes.includes(row.barcode)}
          onChange={() => toggleSelect(row.barcode)}
          className={styles.checkbox}
        />
      ),
    },
    {
      key: 'barcode',
      header: 'KODE UNIK',
      render: (v) => <code style={{ fontSize: '11px' }}>{v}</code>,
    },
    {
      key: 'nomorPO',
      header: 'Nomor PO',
      render: (v) => <span className={styles.poBadge}>{v}</span>,
    },
    { key: 'modelId', header: 'Model', render: (id) => model.find(m => m.id === id)?.nama || id },
    { key: 'warnaId', header: 'Warna', render: (id) => warna.find(w => w.id === id)?.nama || id },
    { key: 'sizeId', header: 'Size', render: (id) => (sizes as any[]).find(s => s.id === id)?.nama || id },
    { key: 'qtyBundle', header: 'QTY', render: (v: any) => <strong>{v} pcs</strong> },
    {
      key: 'bundle',
      header: 'Status',
      render: () => <Badge variant="warning">Menunggu</Badge>,
    },
  ];

  const columnsCutting: Column<CuttingArticleItem>[] = [
    {
      key: 'barcode',
      header: 'KODE UNIK',
      render: (v) => <code style={{ fontSize: '11px' }}>{v}</code>,
    },
    {
      key: 'nomorPO',
      header: 'Nomor PO',
      render: (v) => <span className={styles.poBadge}>{v}</span>,
    },
    { key: 'modelId', header: 'Model', render: (id) => model.find(m => m.id === id)?.nama || id },
    { key: 'warnaId', header: 'Warna', render: (id) => warna.find(w => w.id === id)?.nama || id },
    { key: 'sizeId', header: 'Size', render: (id) => (sizes as any[]).find(s => s.id === id)?.nama || id },
    { key: 'qtyBundle', header: 'Target', render: (v: any) => <strong>{v} pcs</strong> },
    {
      key: 'bundle',
      header: 'Status',
      render: () => <Badge variant="info">Sedang Dipotong</Badge>,
    },
  ];

  // ── Konten Print ──────────────────────────────────────────────────────────

  const selectedItems = queueAntrian.filter(i => selectedBarcodes.includes(i.barcode));

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
            <th>No</th>
            <th>Kode PO</th>
            <th>KODE UNIK (Range)</th>
            <th>Artikel</th>
            <th>Size</th>
            <th>Warna</th>
            <th>Target QTY</th>
            <th>Bundle</th>
          </tr>
        </thead>
        <tbody>
          {groupForSPK(selectedItems).map((g, index) => (
            <tr key={index}>
              <td className={styles.center}>{index + 1}</td>
              <td className={styles.bold}>{g.nomorPO}</td>
              <td style={{ fontSize: '11px' }}>{g.range}</td>
              <td>{model.find(m => m.id === g.modelId)?.nama || g.modelId}</td>
              <td className={styles.center}>{(sizes as any[]).find(s => s.id === g.sizeId)?.nama || g.sizeId}</td>
              <td className={styles.center}>{warna.find(w => w.id === g.warnaId)?.nama || g.warnaId}</td>
              <td className={styles.center}>{g.totalQty}</td>
              <td className={styles.center}>{g.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.validationGrid}>
        <div className={styles.signBox}>
          <p>Admin Produksi</p>
          <div className={styles.signSpace}></div>
          <p>( ________________ )</p>
        </div>
        <div className={styles.signBox}>
          <p>Kepala Cutting</p>
          <div className={styles.signSpace}></div>
          <p>( ________________ )</p>
        </div>
        <div className={styles.signBox}>
          <p>Bagian Jahit</p>
          <div className={styles.signSpace}></div>
          <p>( ________________ )</p>
        </div>
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageWrapper title="Cutting Room" subtitle="Kelola antrian potong kain produksi">
      <div className={styles.container}>

        {/* Tab Switch */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'antrian' ? styles.active : ''}`}
            onClick={() => setActiveTab('antrian')}
          >
            📋 Antrian Menunggu <span className={styles.count}>{queueAntrian.length}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'cutting' ? styles.active : ''}`}
            onClick={() => setActiveTab('cutting')}
          >
            ✂️ Sedang Dipotong <span className={styles.count}>{queueCutting.length}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <TextInput
            placeholder="Cari Nomor PO..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          {activeTab === 'antrian' && selectedBarcodes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setPreviewMode('spk')}>👁️ Preview SPK</Button>
              <Button variant="primary" onClick={() => handlePrint('spk')}>
                🖨️ Cetak SPK & Mulai ({selectedBarcodes.length})
              </Button>
              <Button variant="secondary" onClick={() => setPreviewMode('barcode')}>👁️ Preview Barcode</Button>
              <Button variant="primary" onClick={() => handlePrint('barcode')}>🖨️ Cetak Barcode</Button>
            </div>
          )}
        </div>

        {/* Tab Antrian */}
        {activeTab === 'antrian' && (
          <Panel title={`Antrian Menunggu SPK (${queueAntrian.length})`}>
            {queueAntrian.length > 0 && (
              <div className={styles.selectAllRow}>
                <label className={styles.selectAllLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedBarcodes.length === queueAntrian.length}
                    onChange={toggleSelectAll}
                  />
                  {selectedBarcodes.length > 0
                    ? `${selectedBarcodes.length} bundle dipilih`
                    : 'Pilih Semua'}
                </label>
              </div>
            )}
            <DataTable
              columns={columnsAntrian}
              data={queueAntrian}
              keyField="barcode"
              emptyMessage="Tidak ada antrian. Buat PO baru untuk memulai produksi."
            />
          </Panel>
        )}

        {/* Tab Cutting — Read-Only Monitoring */}
        {activeTab === 'cutting' && (
          <>
            {/* Info Callout */}
            <div className={styles.infoBanner}>
              <span className={styles.infoBannerIcon}>✂️</span>
              <div>
                <strong>Proses sedang berjalan di lantai produksi</strong>
                <p>
                  Untuk menyelesaikan proses, operator wajib scan barcode bundle di halaman{' '}
                  <strong>Scan → Cutting</strong>{' '}
                  setelah selesai memotong setiap bundle.
                </p>
              </div>
            </div>

            <Panel title={`Sedang Dipotong (${queueCutting.length})`}>
              <DataTable
                columns={columnsCutting}
                data={queueCutting}
                keyField="barcode"
                emptyMessage="Tidak ada bundle yang sedang dipotong. Pilih bundle dan cetak SPK terlebih dahulu."
              />
            </Panel>
          </>
        )}

        {/* Modal Preview */}
        {previewMode && isMounted && (
          <Modal open={true} onClose={() => setPreviewMode(null)} size="xl">
            <ModalHeader title={`Preview ${previewMode === 'spk' ? 'SPK' : 'Barcode'}`} onClose={() => setPreviewMode(null)} />
            <ModalBody>
              <div style={{ background: 'white', color: 'black', padding: '20px', borderRadius: '8px' }}>
                {previewMode === 'spk' ? spkContent : barcodeContent}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setPreviewMode(null)}>Tutup</Button>
              <Button variant="primary" onClick={() => handlePrint(previewMode)}>Cetak</Button>
            </ModalFooter>
          </Modal>
        )}

        {/* Portal Print */}
        {isMounted && printMode && createPortal(
          printMode === 'spk' ? spkContent : barcodeContent,
          document.body
        )}

      </div>
    </PageWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function groupForSPK(items: CuttingArticleItem[]) {
  const groups: Record<string, any> = {};
  items.forEach(b => {
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
      };
    }
    groups[key].totalQty += b.qtyBundle;
    groups[key].count += 1;
    groups[key].barcodes.push(b.barcode);
  });
  return Object.values(groups).map(g => {
    const sorted = [...g.barcodes].sort();
    return {
      ...g,
      range: sorted.length > 1 ? `${sorted[0]} … ${sorted[sorted.length - 1]}` : sorted[0],
    };
  });
}
