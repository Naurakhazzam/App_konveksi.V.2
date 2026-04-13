'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useMasterStore } from '@/stores/useMasterStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useSerahTerimaStore } from '@/stores/useSerahTerimaStore';
import { Bundle, SerahTerimaJahit, HPPKomponen, ProdukHPPItem } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import styles from './ModalSerahTerimaJahit.module.css';

interface ModalSerahTerimaJahitProps {
  open: boolean;
  onClose: () => void;
  onApprove: (record: SerahTerimaJahit) => void;
  bundle: Bundle;
  karyawanId: string;
}

export default function ModalSerahTerimaJahit({
  open,
  onClose,
  onApprove,
  bundle,
  karyawanId,
}: ModalSerahTerimaJahitProps) {
  const { produk, hppKomponen, produkHPPItems, karyawan, model, warna, sizes } = useMasterStore();
  const { items: inventoryItems, consumeFIFO } = useInventoryStore();
  const { addRecord } = useSerahTerimaStore();

  const [inputQtys, setInputQtys] = useState<Record<string, number>>({});
  const [isReady, setIsReady] = useState(false);

  // Data Matching
  const penjahitNama = karyawan.find(k => k.id === karyawanId)?.nama || karyawanId;
  const matchedProduk = produk.find(p => 
    p.modelId === bundle.model && 
    p.warnaId === bundle.warna && 
    p.sizeId === bundle.size
  );
  
  const modelName = model.find(m => m.id === bundle.model)?.nama || bundle.model;
  const warnaName = warna.find(w => w.id === bundle.warna)?.nama || bundle.warna;
  const sizeName = (sizes as any[]).find(s => s.id === bundle.size)?.nama || bundle.size;

  const hppItems = matchedProduk 
    ? produkHPPItems.filter(h => h.produkId === matchedProduk.id)
    : [];

  const countableItems = hppItems.filter(h => {
    const komp = hppKomponen.find(k => k.id === h.komponenId);
    return komp?.trackInventory === true;
  });

  const bulkItems = hppItems.filter(h => {
    const komp = hppKomponen.find(k => k.id === h.komponenId);
    return komp?.trackInventory !== true && komp?.kategori === 'bahan_baku';
  });

  // Initialize Suggested Qtys
  useEffect(() => {
    if (open) {
      const initial: Record<string, number> = {};
      countableItems.forEach(item => {
        if (item.qtyFisik) {
          initial[item.id] = item.qtyFisik * bundle.qtyBundle;
        }
      });
      setInputQtys(initial);
    }
  }, [open, bundle.barcode]);

  // Validation
  useEffect(() => {
    const allFilled = countableItems.every(item => inputQtys[item.id] !== undefined && inputQtys[item.id] !== null);
    setIsReady(allFilled);
  }, [inputQtys, countableItems]);

  const handleQtyChange = (hppItemId: string, val: string) => {
    const num = parseFloat(val);
    setInputQtys((prev) => ({ ...prev, [hppItemId]: isNaN(num) ? 0 : num }));
  };

  const getStokInfo = (komponenId: string) => {
    const komp = hppKomponen.find(k => k.id === komponenId);
    if (!komp || !komp.inventoryItemId) return null;
    const invItem = inventoryItems.find(i => i.id === komp.inventoryItemId);
    if (!invItem) return null;

    let statusType: 'stokOk' | 'stokWarn' | 'stokDanger' = 'stokOk';
    let icon = '✅';
    if (invItem.stokAktual <= 0) {
      statusType = 'stokDanger';
      icon = '🔴';
    } else if (invItem.stokAktual <= invItem.stokMinimum) {
      statusType = 'stokWarn';
      icon = '⚠️';
    }

    return { 
      status: `${icon} ${invItem.stokAktual} ${invItem.satuanId}`,
      className: styles[statusType],
      hasWarn: statusType !== 'stokOk'
    };
  };

  const handleApprove = () => {
    // 1. Consume Inventory
    const recordItems = countableItems.map(item => {
      const komp = hppKomponen.find(k => k.id === item.komponenId);
      const qtyToConsume = inputQtys[item.id] || 0;
      
      if (komp?.inventoryItemId) {
        consumeFIFO(komp.inventoryItemId, qtyToConsume);
      }

      return {
        komponenHPPId: item.komponenId,
        inventoryItemId: komp?.inventoryItemId || '',
        qtyDiserahkan: qtyToConsume,
        qtyFisikPerPcs: item.qtyFisik || 0
      };
    });

    // 2. Create Record
    const newRecord: SerahTerimaJahit = {
      id: `STJ-${Date.now()}`,
      barcode: bundle.barcode,
      poNomor: bundle.po,
      modelId: bundle.model,
      warnaId: bundle.warna,
      sizeId: bundle.size,
      qtyBundle: bundle.qtyBundle,
      karyawanId: karyawanId,
      tanggal: new Date().toISOString(),
      items: recordItems,
      status: 'approved'
    };

    // 3. Save
    addRecord(newRecord);
    onApprove(newRecord);
  };

  const anyStokWarning = [...countableItems, ...bulkItems].some(item => {
    const info = getStokInfo(item.komponenId);
    return info?.hasWarn;
  });

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className={styles.modal}>
        <div className={`${styles.header} ${styles.screenOnly}`}>
          <h2 className={styles.title}>📄 Surat Serah Terima Kerja</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>&times;</Button>
        </div>

        <div className={styles.content}>
          <div className={styles.bundleInfo}>
            <div><span className={styles.infoLabel}>PO</span><span className={styles.infoValue}>{bundle.po}</span></div>
            <div><span className={styles.infoLabel}>Tanggal</span><span className={styles.infoValue}>{formatDate(new Date().toISOString())}</span></div>
            <div><span className={styles.infoLabel}>Model</span><span className={styles.infoValue}>{modelName}</span></div>
            <div><span className={styles.infoLabel}>Warna</span><span className={styles.infoValue}>{warnaName}</span></div>
            <div><span className={styles.infoLabel}>Size</span><span className={styles.infoValue}>{sizeName}</span></div>
            <div><span className={styles.infoLabel}>QTY Bundle</span><span className={styles.infoValue}>{bundle.qtyBundle} pcs</span></div>
            <div className={styles.screenOnly}><span className={styles.infoLabel}>Penjahit</span><span className={styles.infoValue}>{penjahitNama}</span></div>
          </div>

          {/* Section: Accessorries */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span>📋 Aksesori yang Diserahkan</span>
              <span className={styles.line}></span>
            </h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Aksesori</th>
                    <th>Saran</th>
                    <th>Qty Input</th>
                    <th className={styles.screenOnly}>Stok Gudang</th>
                  </tr>
                </thead>
                <tbody>
                  {countableItems.map(item => {
                    const komp = hppKomponen.find(k => k.id === item.komponenId);
                    const stokInfo = getStokInfo(item.komponenId);
                    return (
                      <tr key={item.id}>
                        <td><strong>{komp?.nama}</strong></td>
                        <td>{item.qtyFisik ? `${item.qtyFisik * bundle.qtyBundle} ${komp?.satuan}` : '—'}</td>
                        <td>
                          <input 
                            type="number" 
                            className={styles.inputQty} 
                            value={inputQtys[item.id] ?? ''} 
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                            min="0"
                          />
                        </td>
                        <td className={styles.screenOnly}>
                          {stokInfo && <span className={stokInfo.className}>{stokInfo.status}</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {countableItems.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px', color: 'var(--color-text-sub)' }}>
                        Tidak ada aksesori yang perlu di-track.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Bulk Materials (Info only) */}
          <div className={`${styles.section} ${styles.screenOnly}`}>
            <h4 className={styles.sectionTitle}>
              <span>ℹ️ Bahan Pendukung (Reminder)</span>
              <span className={styles.line}></span>
            </h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Bahan</th>
                    <th>Status Stok Gudang</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkItems.map(item => {
                    const komp = hppKomponen.find(k => k.id === item.komponenId);
                    const stokInfo = getStokInfo(item.komponenId);
                    return (
                      <tr key={item.id}>
                        <td>{komp?.nama}</td>
                        <td>
                          {stokInfo && <span className={stokInfo.className}>{stokInfo.status}</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {bulkItems.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', paddingTop: '10px', paddingBottom: '10px', color: 'var(--color-text-sub)' }}>
                        Tidak ada bahan pendukung khusus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {anyStokWarning && (
            <div className={`${styles.alert} ${styles.screenOnly}`}>
              ⚠️ <strong>Perhatian:</strong> Beberapa stok aksesori/bahan menipis atau habis. 
              Pastikan ketersediaan fisik sebelum menyerahkan ke penjahit.
            </div>
          )}

          {/* Print Signatures */}
          <div className={styles.printOnly}>
             <p style={{ fontSize: '12px', marginTop: '20px', fontStyle: 'italic' }}>
               Dokumen ini adalah bukti serah terima bahan kerja.
             </p>
             <div className={styles.signatureArea}>
                <div className={styles.sigBox}>
                  <div>Penjahit,</div>
                  <div className={styles.sigLine}>({penjahitNama})</div>
                </div>
                <div className={styles.sigBox}>
                  <div>Admin,</div>
                  <div className={styles.sigLine}>(................)</div>
                </div>
             </div>
          </div>
        </div>

        <div className={`${styles.footer} ${styles.screenOnly}`}>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="ghost" onClick={() => window.print()}>🖨️ Print</Button>
          <Button 
            variant="primary" 
            onClick={handleApprove} 
            disabled={!isReady}
          >
            ✅ Approve & Serahkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
