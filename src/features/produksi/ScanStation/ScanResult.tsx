'use client';

import React, { useState } from 'react';
import { Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Label } from '@/components/atoms/Typography';
import { usePOStore } from '@/stores/usePOStore';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { useScanStore } from '@/stores/useScanStore';
import {
  TahapKey, TAHAP_ORDER, TAHAP_LABEL, REQUIRES_KARYAWAN,
  validateCanTerima, getQtyTerima, getTahapStatusIcon
} from '@/lib/utils/production-helpers';
import ModalQtySelesai from './ModalQtySelesai';
import ModalReject from './ModalReject';
import ModalPemakaianBahan from './ModalPemakaianBahan';
import styles from './ScanResult.module.css';

interface ScanResultProps {
  bundle: Bundle;
  tahap: TahapKey;
  onComplete?: () => void;
}

export default function ScanResult({ bundle, tahap, onComplete }: ScanResultProps) {
  const { model, warna, sizes, karyawan } = useMasterStore();
  const { updateStatusTahap } = useBundleStore();
  const { poList, getPemakaianBahan, addPemakaianBahan, updateItemCuttingStatus } = usePOStore();
  const { addToQueue } = useKoreksiStore();
  const { addRecord } = useScanStore();
  
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBahanModal, setShowBahanModal] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState('');

  const modelName = model.find(m => m.id === bundle.model)?.nama || bundle.model;
  const warnaName = warna.find(w => w.id === bundle.warna)?.nama || bundle.warna;
  const sizeName = (sizes as any[]).find(s => s.id === bundle.size)?.nama || bundle.size;

  const currentStatus = bundle.statusTahap[tahap];
  const validation = validateCanTerima(bundle, tahap);
  const qtyTerimaDefault = getQtyTerima(bundle, tahap);
  const needsKaryawan = REQUIRES_KARYAWAN.includes(tahap);

  // Status Cutting Check
  const po = poList.find(p => p.nomorPO === bundle.po);
  const poItem = po?.items.find(i => i.modelId === bundle.model && i.warnaId === bundle.warna && i.sizeId === bundle.size);
  // Perbaikan isCuttingStarted: Default ke true jika poItem tidak ditemukan agar tidak nge-hang, 
  // atau cek status jika poItem ada.
  const isCuttingStarted = tahap !== 'cutting' || !poItem || poItem.statusCutting === 'started' || poItem.statusCutting === 'finished';

  const canTerima = validation.canTerima && (!needsKaryawan || !!selectedKaryawan) && isCuttingStarted;
  const canSelesai = currentStatus.status === 'terima';
  const canReject = currentStatus.status === 'terima' || currentStatus.status === 'selesai';

  const handleTerima = () => {
    if (tahap === 'cutting') {
      const existingBahan = getPemakaianBahan(bundle.po, bundle.model, bundle.warna, bundle.size);
      if (!existingBahan) {
        setShowBahanModal(true);
        return;
      }
      // If bahan exists but we are in cutting, we might still want to prompt for Qty immediately
      setShowQtyModal(true);
      return;
    }
    
    executeTerima(qtyTerimaDefault);
  };

  const executeTerima = (finalQty: number) => {
    const now = new Date().toISOString();
    updateStatusTahap(bundle.barcode, tahap, {
      status: 'terima',
      qtyTerima: finalQty,
      waktuTerima: now,
      karyawan: needsKaryawan ? selectedKaryawan : null,
    });

    // Record to Scan Store
    addRecord({
      id: `SCAN-${Date.now()}`,
      barcode: bundle.barcode,
      po: bundle.po,
      tahap,
      aksi: 'terima',
      qty: finalQty,
      waktu: now
    });

    if (onComplete) onComplete();
  };

  const handleBahanConfirm = (meter: number, gram: number) => {
    addPemakaianBahan({
      po: bundle.po,
      skuKlien: bundle.skuKlien,
      modelId: bundle.model,
      warnaId: bundle.warna,
      sizeId: bundle.size,
      artikelNama: `${modelName} - ${warnaName} - ${sizeName}`,
      pemakaianKainMeter: meter,
      pemakaianBeratGram: gram,
      inputOleh: 'ADMIN',
      waktuInput: new Date().toISOString()
    });
    setShowBahanModal(false);
    
    // Step 2: Open Qty Modal after Bahan
    if (tahap === 'cutting') {
      setShowQtyModal(true);
    } else {
      executeTerima(qtyTerimaDefault);
    }
  };

  const handleQtyConfirm = (qtySelesai: number, alasan: string, needsKoreksi: boolean) => {
    const now = new Date().toISOString();
    
    if (tahap === 'cutting' && currentStatus.status === null) {
      if (poItem) {
        updateItemCuttingStatus(poItem.id, 'finished');
      }
      
      // Lompat langsung ke Selesai untuk Cutting, catat Qty & Karyawan (Penting untuk Upah)
      updateStatusTahap(bundle.barcode, tahap, {
        status: 'selesai',
        qtyTerima: qtySelesai,
        qtySelesai: qtySelesai,
        waktuTerima: now,
        waktuSelesai: now,
        karyawan: selectedKaryawan,
      });

      addRecord({
        id: `SCAN-${Date.now()}`,
        barcode: bundle.barcode,
        po: bundle.po,
        tahap,
        aksi: 'selesai',
        qty: qtySelesai,
        waktu: now
      });

      setShowQtyModal(false);
      if (onComplete) onComplete();
      return;
    }

    // Normal 'Selesai' Flow
    if (needsKoreksi) {
      addToQueue({
        id: `KOR-${Date.now()}`,
        barcode: bundle.barcode,
        tahap,
        qtyTarget: currentStatus.qtyTerima || qtyTerimaDefault,
        qtyAktual: qtySelesai,
        tipe: 'lebih',
        alasan: alasan || 'QTY Melebihi target',
        status: 'pending',
        diajukanOleh: 'ADMIN',
        waktuAjukan: now
      });
    }

    updateStatusTahap(bundle.barcode, tahap, {
      status: 'selesai',
      qtySelesai,
      waktuSelesai: now,
      koreksiStatus: needsKoreksi ? 'pending' : null,
      koreksiAlasan: alasan || null,
    });

    // Record to Scan Store
    addRecord({
      id: `SCAN-${Date.now()}`,
      barcode: bundle.barcode,
      po: bundle.po,
      tahap,
      aksi: 'selesai',
      qty: qtySelesai,
      waktu: now
    });

    if (onComplete) onComplete();
  };

  return (
    <div className={styles.card}>
      {/* Info Bundle */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}><Label color="sub">PO</Label><span>{bundle.po}</span></div>
        <div className={styles.infoItem}><Label color="sub">Model</Label><span>{modelName}</span></div>
        <div className={styles.infoItem}><Label color="sub">Warna</Label><span>{warnaName}</span></div>
        <div className={styles.infoItem}><Label color="sub">Size</Label><span>{sizeName}</span></div>
        <div className={styles.infoItem}><Label color="sub">QTY Bundle</Label><strong>{bundle.qtyBundle} pcs</strong></div>
        <div className={styles.infoItem}><Label color="sub">Barcode</Label><code className={styles.barcode}>{bundle.barcode}</code></div>
      </div>

      {/* Timeline 7 tahap */}
      <div className={styles.timeline}>
        {TAHAP_ORDER.map(t => {
          const st = bundle.statusTahap[t];
          return (
            <div key={t} className={styles.timelineStep} data-active={t === tahap}>
              <span className={styles.icon}>{getTahapStatusIcon(st.status)}</span>
              <span className={styles.label}>{TAHAP_LABEL[t]}</span>
              {st.status === 'selesai' && <span className={styles.qty}>{st.qtySelesai}pcs</span>}
              {st.koreksiStatus === 'pending' && <Badge variant="warning">Koreksi</Badge>}
            </div>
          );
        })}
      </div>

      {/* Validation warning */}
      {validation.blockReason && (
        <div className={styles.blockAlert}>⛔ {validation.blockReason}</div>
      )}

      {/* Cutting specific warning */}
      {tahap === 'cutting' && poItem?.statusCutting === 'waiting' && (
        <div className={styles.blockAlert}>⚠️ PO/Artikel ini belum dimulai di <strong>Cutting Room</strong>. Silakan "Mulai Potong" terlebih dahulu.</div>
      )}

      {/* Select Karyawan (hanya cutting & jahit) */}
      {needsKaryawan && currentStatus.status === null && (
        <div className={styles.karyawanField}>
          <Label>Operator / Karyawan <span className={styles.req}>*</span></Label>
          <select className={styles.select} value={selectedKaryawan} onChange={e => setSelectedKaryawan(e.target.value)}>
            <option value="">-- Pilih karyawan --</option>
            {karyawan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        {tahap !== 'cutting' && (
          <Button variant="primary" onClick={handleTerima} disabled={!canTerima}>
            ✅ Terima
          </Button>
        )}
        <Button 
          variant={tahap === 'cutting' ? 'primary' : 'secondary'} 
          onClick={tahap === 'cutting' ? handleTerima : () => setShowQtyModal(true)} 
          disabled={tahap === 'cutting' ? !canTerima : !canSelesai}
        >
          🏁 Selesai
        </Button>
        <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={!canReject}>
          ❌ Reject
        </Button>
      </div>

      <ModalQtySelesai
        open={showQtyModal}
        onClose={() => setShowQtyModal(false)}
        onConfirm={handleQtyConfirm}
        qtyTerima={currentStatus.status === 'terima' ? currentStatus.qtyTerima : qtyTerimaDefault}
        tahap={tahap}
        title={tahap === 'cutting' && currentStatus.status === null ? "Input Hasil Potong (Actual Yield)" : undefined}
      />
      <ModalReject
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        barcode={bundle.barcode}
        tahap={tahap}
        qtyMax={currentStatus.qtyTerima || qtyTerimaDefault}
      />
      <ModalPemakaianBahan 
        open={showBahanModal}
        onClose={() => setShowBahanModal(false)}
        artikelNama={`${modelName} - ${warnaName} - ${sizeName}`}
        poNomor={bundle.po}
        onConfirm={handleBahanConfirm}
      />
    </div>
  );
}
