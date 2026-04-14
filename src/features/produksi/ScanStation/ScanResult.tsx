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
  validateCanTerima, getQtyTerima, getTahapStatusIcon, getPrevTahap, getExpectedQTY,
  getBundleIssueSummary
} from '@/lib/utils/production-helpers';
import ModalQtySelesai from './ModalQtySelesai';
import ModalReject from './ModalReject';
import ModalPemakaianBahan from './ModalPemakaianBahan';
import ModalSerahTerimaJahit from './ModalSerahTerimaJahit';
import { ModalKoreksiKurang, ModalKoreksiLebih, KoreksiKurangResult, KoreksiLebihResult } from './ModalKoreksiQTY';
import { useSerahTerimaStore } from '@/stores/useSerahTerimaStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import styles from './ScanResult.module.css';

interface ScanResultProps {
  bundle: Bundle;
  tahap: TahapKey;
  onComplete?: () => void;
}

export default function ScanResult({ bundle, tahap, onComplete }: ScanResultProps) {
  const { model, warna, sizes, karyawan, hppKomponen, produkHPPItems } = useMasterStore();
  const { updateStatusTahap } = useBundleStore();
  const { poList, getPemakaianBahan, addPemakaianBahan, updateItemCuttingStatus } = usePOStore();
  const { addKoreksi, koreksiList } = useKoreksiStore();
  const { addRecord } = useScanStore();

  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBahanModal, setShowBahanModal] = useState(false);
  const [showSerahTerima, setShowSerahTerima] = useState(false);
  const [showKoreksiKurang, setShowKoreksiKurang] = useState(false);
  const [showKoreksiLebih, setShowKoreksiLebih] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState('');

  // Pending qty data passed through to koreksi modals
  const [pendingQtySelesai, setPendingQtySelesai] = useState(0);

  const { getByBarcode } = useSerahTerimaStore();

  const modelName = model.find(m => m.id === bundle.model)?.nama || bundle.model;
  const warnaName = warna.find(w => w.id === bundle.warna)?.nama || bundle.warna;
  const sizeName = (sizes as any[]).find(s => s.id === bundle.size)?.nama || bundle.size;

  const currentStatus = bundle.statusTahap[tahap];
  const validation = validateCanTerima(bundle, tahap);

  // Use cascading QTY as expected instead of raw qtyBundle
  const expectedQty = getExpectedQTY(bundle, tahap, koreksiList);
  const qtyTerimaDefault = getQtyTerima(bundle, tahap);

  const needsKaryawan = REQUIRES_KARYAWAN.includes(tahap);

  // Status Cutting Check
  const po = poList.find(p => p.id === bundle.po);
  const poItem = po?.items.find(i => i.modelId === bundle.model && i.warnaId === bundle.warna && i.sizeId === bundle.size);

  const isCuttingStage = tahap === 'cutting';
  const isCuttingStarted = !isCuttingStage || (poItem?.statusCutting === 'started' || poItem?.statusCutting === 'finished');

  let cuttingBlockReason = null;
  if (isCuttingStage) {
    if (!poItem) {
      cuttingBlockReason = "Data tidak ada di list cutting, harap pastikan dengan benar.";
    } else if (poItem.statusCutting === 'waiting') {
      cuttingBlockReason = "Artikel belum dimulai di Cutting Room. Harap pilih 'Mulai Potong' terlebih dahulu di menu Antrian Cutting.";
    }
  }

  const canTerima = validation.canTerima &&
                    (!needsKaryawan || !!selectedKaryawan) &&
                    isCuttingStarted &&
                    !cuttingBlockReason;

  const canSelesai = currentStatus.status === 'terima';
  const canReject = currentStatus.status === 'terima' || currentStatus.status === 'selesai';

  // Check active reject pending for this bundle at this tahap (re-scan perbaikan)
  const activeRejectForThisBundle = koreksiList.filter(
    k =>
      k.barcode === bundle.barcode &&
      k.tahapBertanggungJawab === tahap &&
      k.statusPotongan === 'pending'
  );

  const pendingApprovalSurplus = koreksiList.find(
    k =>
      k.barcode === bundle.barcode &&
      k.tahapDitemukan === tahap &&
      k.jenisKoreksi === 'lebih' &&
      k.statusApproval === 'menunggu'
  );

  const handleTerima = () => {
    if (tahap === 'cutting') {
      const existingBahan = getPemakaianBahan(bundle.po, bundle.model, bundle.warna, bundle.size);
      if (!existingBahan) {
        setShowBahanModal(true);
        return;
      }
      setShowQtyModal(true);
      return;
    }

    if (tahap === 'jahit' && currentStatus.status === null) {
      const existingRecord = getByBarcode(bundle.barcode);
      if (!existingRecord) {
        setShowSerahTerima(true);
        return;
      }
    }

    executeTerima(qtyTerimaDefault);
  };

  const handleSerahTerimaApprove = () => {
    setShowSerahTerima(false);
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
    if (tahap === 'cutting') {
      setShowQtyModal(true);
    } else {
      executeTerima(qtyTerimaDefault);
    }
  };

  // Hitung nominal potongan berdasarkan jenis dampak
  const calcNominalPotongan = (
    dampakPotongan: 'upah_tahap' | 'hpp_po',
    tahapBertanggungjawab: string,
    qty: number
  ): number => {
    if (dampakPotongan === 'hpp_po') {
      // HPP per pcs dari PO: pakai semua HPP komponen kategori bahan_baku
      const bahanKomponen = hppKomponen.filter(k => k.kategori === 'bahan_baku');
      const totalHPP = bahanKomponen.reduce((sum, k) => {
        const item = produkHPPItems.find(i => i.komponenId === k.id);
        return sum + (item ? item.harga * item.qty : 0);
      }, 0);
      return totalHPP * qty;
    }
    // upah_tahap: cari HPP komponen upah untuk tahap tersebut
    const tahapLabel = TAHAP_LABEL[tahapBertanggungjawab as TahapKey] || tahapBertanggungjawab;
    const komponen = hppKomponen.find(k =>
      k.nama.toLowerCase().includes(tahapLabel.toLowerCase())
    );
    if (!komponen) return 0;
    const hppItem = produkHPPItems.find(i => i.komponenId === komponen.id);
    return (hppItem?.harga || 0) * qty;
  };

  const handleQtyConfirm = (qtySelesai: number, alasan: string, needsKoreksiOld: boolean) => {
    const now = new Date().toISOString();

    if (tahap === 'cutting' && currentStatus.status === null) {
      if (poItem) {
        updateItemCuttingStatus(poItem.id, 'finished');
      }
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

    const qtyTarget = currentStatus.qtyTerima ?? qtyTerimaDefault;
    const diff = qtySelesai - qtyTarget;

    if (diff < 0) {
      // QTY KURANG → simpan pending qty, buka modal koreksi kurang
      setPendingQtySelesai(qtySelesai);
      setShowQtyModal(false);
      setShowKoreksiKurang(true);
      return;
    }

    if (diff > 0) {
      // QTY LEBIH → buka modal koreksi lebih
      setPendingQtySelesai(qtySelesai);
      setShowQtyModal(false);
      setShowKoreksiLebih(true);
      return;
    }

    // QTY tepat → selesai normal
    executeSelesai(qtySelesai, null, null);
  };

  const executeSelesai = (
    qtySelesai: number,
    koreksiStatus: 'pending' | null,
    koreksiAlasan: string | null
  ) => {
    const now = new Date().toISOString();
    
    // 1. Update Bundle Store
    updateStatusTahap(bundle.barcode, tahap, {
      status: 'selesai',
      qtySelesai,
      waktuSelesai: now,
      koreksiStatus,
      koreksiAlasan,
    });

    // 2. Add Scan Record
    addRecord({
      id: `SCAN-${Date.now()}`,
      barcode: bundle.barcode,
      po: bundle.po,
      tahap,
      aksi: 'selesai',
      qty: qtySelesai,
      waktu: now
    });

    // 3. LOGIKA BARU: Sambungkan ke Payroll
    // Hanya jika tahap ini membutuhkan karyawan dan ada karyawan terpilih
    const operatorId = currentStatus.karyawan || selectedKaryawan;
    if (operatorId && qtySelesai > 0) {
      // Hitung upah per pcs untuk tahap ini
      const upahPerPcs = calcNominalPotongan('upah_tahap', tahap, 1);
      const totalUpah = upahPerPcs * qtySelesai;

      const { addLedgerEntry } = usePayrollStore.getState();
      addLedgerEntry({
        id: `PAY-${Date.now()}-${bundle.barcode}-${tahap}`,
        karyawanId: operatorId,
        tanggal: now,
        deskripsi: `Upah ${TAHAP_LABEL[tahap]} - PO: ${bundle.po} (${bundle.barcode})`,
        qty: qtySelesai,
        tarif: upahPerPcs,
        total: totalUpah,
        tipe: 'selesai',
        status: 'belum_bayar'
      });
    }

    if (onComplete) onComplete();
  };

  const handleKoreksiKurangConfirm = (result: KoreksiKurangResult) => {
    const qtyTarget = currentStatus.qtyTerima ?? qtyTerimaDefault;
    const qtyKurang = qtyTarget - pendingQtySelesai;
    const now = new Date().toISOString();

    // Tentukan tahap bertanggung jawab
    let tahapBertanggungJawab: string = tahap;
    let dampakPotongan: 'upah_tahap' | 'hpp_po' = 'upah_tahap';

    if (result.jenisKoreksi === 'reject' && result.alasanReject) {
      tahapBertanggungJawab = result.alasanReject.tahapBertanggungJawab;
      dampakPotongan = result.alasanReject.dampakPotongan;
    } else {
      // Hilang / salah hitung → tahap sebelumnya
      const prev = getPrevTahap(tahap);
      if (prev) tahapBertanggungJawab = prev;
    }

    // Cari karyawan di tahap yang bertanggungjawab pada bundle ini
    const statusBertanggungjawab = bundle.statusTahap[tahapBertanggungJawab as TahapKey] || bundle.statusTahap[tahap];
    const karyawanBertanggungJawab = statusBertanggungjawab?.karyawan || '';

    const nominal = calcNominalPotongan(dampakPotongan, tahapBertanggungJawab, qtyKurang);
    const koreksiId = `KOR-${Date.now()}`;

    addKoreksi({
      id: koreksiId,
      barcode: bundle.barcode,
      poId: bundle.po,
      tahapDitemukan: tahap,
      tahapBertanggungJawab,
      karyawanPelapor: selectedKaryawan || 'ADMIN',
      karyawanBertanggungJawab,
      jenisKoreksi: result.jenisKoreksi,
      alasanRejectId: result.alasanReject?.id,
      qtyKoreksi: qtyKurang,
      nominalPotongan: nominal,
      statusPotongan: 'pending',
      waktuLapor: now,
    });

    // LOGIKA BARU: Tambah Potongan ke Payroll
    if (karyawanBertanggungJawab && nominal > 0) {
      usePayrollStore.getState().addLedgerEntry({
        id: `DED-${Date.now()}-${koreksiId}`,
        karyawanId: karyawanBertanggungJawab,
        tanggal: now,
        deskripsi: `POTONGAN ${result.jenisKoreksi.toUpperCase()} (${TAHAP_LABEL[tahap]}) - ${bundle.barcode}`,
        qty: qtyKurang,
        tarif: - (nominal / qtyKurang),
        total: -nominal,
        tipe: 'reject_potong',
        status: 'belum_bayar',
        metadata: { koreksiId }
      });
    }

    executeSelesai(
      pendingQtySelesai,
      null, // Fixed: Do not block for shortages (Rejects/Lost). Let the remaining pieces move forward.
      result.jenisKoreksi === 'reject'
        ? `Reject: ${result.alasanReject?.nama}`
        : result.jenisKoreksi === 'hilang'
        ? 'Hilang'
        : 'Salah Hitung'
    );
  };

  const handleKoreksiLebihConfirm = (result: KoreksiLebihResult) => {
    const qtyTarget = currentStatus.qtyTerima ?? qtyTerimaDefault;
    const qtyLebih = pendingQtySelesai - qtyTarget;
    const now = new Date().toISOString();

    addKoreksi({
      id: `KOR-${Date.now()}`,
      barcode: bundle.barcode,
      poId: bundle.po,
      tahapDitemukan: tahap,
      tahapBertanggungJawab: tahap,
      karyawanPelapor: selectedKaryawan || 'ADMIN',
      karyawanBertanggungJawab: currentStatus.karyawan || '',
      jenisKoreksi: 'lebih',
      alasanLebih: result.alasanLebih,
      alasanLebihText: result.alasanLebihText,
      qtyKoreksi: qtyLebih,
      nominalPotongan: 0,
      statusPotongan: 'pending',
      statusApproval: 'menunggu',
      waktuLapor: now,
    });

    // QTY tetap sesuai target, bukan qtyLebih, sampai di-approve
    executeSelesai(
      qtyTarget,
      'pending',
      `QTY Lebih +${qtyLebih} — Menunggu Approval`
    );
  };

  // Handle re-scan perbaikan reject
  const handleSelesaiReScan = () => {
    const now = new Date().toISOString();
    activeRejectForThisBundle.forEach(k => {
      // Cancel koreksi → potongan dibatalkan
      useKoreksiStore.getState().cancelKoreksi(k.id);
    });
    const totalQtyPerbaikan = activeRejectForThisBundle.reduce((s, k) => s + k.qtyKoreksi, 0);
    
    // LOGIKA BARU: Catat Upah Perbaikan (Rework)
    const operatorId = currentStatus.karyawan || selectedKaryawan;
    if (operatorId && totalQtyPerbaikan > 0) {
      const upahPerPcs = calcNominalPotongan('upah_tahap', tahap, 1);
      usePayrollStore.getState().addLedgerEntry({
        id: `RWK-${Date.now()}-${bundle.barcode}`,
        karyawanId: operatorId,
        tanggal: now,
        deskripsi: `Upah Perbaikan (Rework) ${TAHAP_LABEL[tahap]} - ${bundle.barcode}`,
        qty: totalQtyPerbaikan,
        tarif: upahPerPcs,
        total: upahPerPcs * totalQtyPerbaikan,
        tipe: 'rework',
        status: 'belum_bayar'
      });
    }

    updateStatusTahap(bundle.barcode, tahap, {
      status: 'selesai',
      qtySelesai: totalQtyPerbaikan,
      waktuSelesai: now,
      koreksiStatus: null,
      koreksiAlasan: null,
    });
    addRecord({
      id: `SCAN-${Date.now()}`,
      barcode: bundle.barcode,
      po: bundle.po,
      tahap,
      aksi: 'selesai',
      qty: totalQtyPerbaikan,
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
        <div className={styles.infoItem}>
          <Label color="sub">QTY Bundle</Label>
          <strong>
            {expectedQty !== bundle.qtyBundle
              ? <><span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '6px' }}>{bundle.qtyBundle}</span>{expectedQty} pcs</>
              : `${bundle.qtyBundle} pcs`
            }
          </strong>
        </div>
        <div className={styles.infoItem}><Label color="sub">Barcode</Label><code className={styles.barcode}>{bundle.barcode}</code></div>
      </div>

      {/* Warning Banner untuk Riwayat Masalah (Histori Reject/Hilang) */}
      {(() => {
        const issueSummary = getBundleIssueSummary(bundle.barcode, koreksiList);
        if (!issueSummary) return null;
        return (
          <div className={styles.historyAlert}>
            <div className={styles.alertHeader}>
              <span className={styles.alertIcon}>🚨</span>
              <strong>RIWAYAT MASALAH TERDETEKSI</strong>
            </div>
            <div className={styles.alertContent}>
              Bundle ini memiliki catatan pengurangan di tahap sebelumnya:
              <ul className={styles.issueList}>
                {issueSummary.split(', ').map((issue, idx) => (
                  <li key={idx}>⚠️ {issue}</li>
                ))}
              </ul>
              <p className={styles.alertAction}>
                Harap konfirmasi ke tim terkait dan pastikan jumlah fisik sesuai dengan sistem ({expectedQty} pcs).
              </p>
            </div>
          </div>
        );
      })()}

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

      {/* Validasi warning */}
      {validation.blockReason && (
        <div className={styles.blockAlert}>⛔ {validation.blockReason}</div>
      )}
      {cuttingBlockReason && (
        <div className={styles.blockAlert}>⚠️ {cuttingBlockReason}</div>
      )}

      {/* Menunggu Approval Surplus */}
      {pendingApprovalSurplus && (
        <div className={styles.blockAlert} style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#1d4ed8' }}>
          ⏳ Bundle ini sedang <strong>Menunggu Approval QTY Lebih</strong> dari Owner. Operasi selanjutnya dikunci hingga disetujui.
        </div>
      )}

      {/* Notifikasi reject perbaikan */}
      {activeRejectForThisBundle.length > 0 && (
        <div className={styles.blockAlert} style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#b45309' }}>
          ⚠️ Bundle ini memiliki <strong>{activeRejectForThisBundle.reduce((s, k) => s + k.qtyKoreksi, 0)} pcs reject</strong> yang perlu diperbaiki.
          <Button
            variant="ghost"
            size="sm"
            style={{ marginLeft: '12px' }}
            onClick={handleSelesaiReScan}
          >
            ✅ Selesai Diperbaiki
          </Button>
        </div>
      )}

      {/* Select Karyawan */}
      {needsKaryawan && currentStatus.status === null && (
        <div className={styles.karyawanField}>
          <Label>Operator / Karyawan <span className={styles.req}>*</span></Label>
          <select className={styles.select} value={selectedKaryawan} onChange={e => setSelectedKaryawan(e.target.value)}>
            <option value="">-- Pilih karyawan --</option>
            {karyawan
              .filter(k => k.aktif && k.tahapList.includes(tahap))
              .map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
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
        qtyTerima={currentStatus.status === 'terima' ? (currentStatus.qtyTerima ?? 0) : qtyTerimaDefault}
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
      <ModalSerahTerimaJahit
        open={showSerahTerima}
        onClose={() => setShowSerahTerima(false)}
        onApprove={handleSerahTerimaApprove}
        bundle={bundle}
        karyawanId={selectedKaryawan}
      />
      <ModalKoreksiKurang
        open={showKoreksiKurang}
        onClose={() => setShowKoreksiKurang(false)}
        onConfirm={handleKoreksiKurangConfirm}
        qtyKurang={(currentStatus.qtyTerima ?? qtyTerimaDefault) - pendingQtySelesai}
        tahapSaatIni={TAHAP_LABEL[tahap]}
      />
      <ModalKoreksiLebih
        open={showKoreksiLebih}
        onClose={() => setShowKoreksiLebih(false)}
        onConfirm={handleKoreksiLebihConfirm}
        qtyLebih={pendingQtySelesai - (currentStatus.qtyTerima ?? qtyTerimaDefault)}
        tahapSaatIni={TAHAP_LABEL[tahap]}
      />
    </div>
  );
}
