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
import { useAuthStore } from '@/stores/useAuthStore';
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
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useToast } from '@/components/molecules/Toast';
import { supabase } from '@/lib/supabase';
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
  const { currentUser } = useAuthStore();
  const { warning } = useToast();

  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBahanModal, setShowBahanModal] = useState(false);
  const [showSerahTerima, setShowSerahTerima] = useState(false);
  const [showKoreksiKurang, setShowKoreksiKurang] = useState(false);
  const [showKoreksiLebih, setShowKoreksiLebih] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Cutting: cek bahan dulu, lalu TERIMA (bukan langsung selesai)
    if (tahap === 'cutting') {
      const existingBahan = getPemakaianBahan(bundle.po, bundle.model, bundle.warna, bundle.size);
      if (!existingBahan) {
        setShowBahanModal(true); // Modal bahan → lalu executeTerima
        return;
      }
      executeTerima(bundle.qtyBundle); // Bahan sudah ada, langsung terima
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

  const executeTerima = async (finalQty: number) => {
    const now = new Date().toISOString();

    try {
      await updateStatusTahap(bundle.barcode, tahap, {
        status: 'terima',
        qtyTerima: finalQty,
        waktuTerima: now,
        karyawan: needsKaryawan ? selectedKaryawan : null,
      });

      await addRecord({
        id: `SCAN-${Date.now()}`,
        barcode: bundle.barcode,
        po: bundle.po,
        tahap,
        aksi: 'terima',
        qty: finalQty,
        waktu: now
      });
      if (onComplete) onComplete();
    } catch (error) {
      warning('Gagal Menyimpan', 'Gagal mencatat data scan terima. Periksa koneksi Anda.');
    }
  };

  const handleBahanConfirm = async (meter: number, gram: number, inventoryItemId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addPemakaianBahan({
        po: bundle.po,
        skuKlien: bundle.skuKlien,
        modelId: bundle.model,
        warnaId: bundle.warna,
        sizeId: bundle.size,
        artikelNama: `${modelName} - ${warnaName} - ${sizeName}`,
        inventoryItemId,
        pemakaianKainMeter: meter,
        pemakaianBeratGram: gram,
        inputOleh: currentUser?.id ?? currentUser?.nama ?? 'SYSTEM',
        waktuInput: new Date().toISOString()
      });

      if (inventoryItemId) {
        if (!meter || meter <= 0) {
          warning('Data Bahan', 'Pemakaian kain tidak valid, stok tidak dipotong.');
        } else {
          // meter per pcs × jumlah pcs bundle = total meter terpakai
          const qtyToConsume = meter * bundle.qtyBundle;
          try {
            const fifoResult = await useInventoryStore.getState().consumeFIFO(inventoryItemId, qtyToConsume);
            // BUG #30: Tampilkan warning jika stok tidak mencukupi — produksi tetap lanjut
            if (fifoResult.insufficient) {
              warning(
                'Stok Tidak Cukup',
                `Stok bahan tidak mencukupi (kurang ${fifoResult.qtyShortfall?.toFixed(2)} unit). Produksi tetap lanjut, harap segera input pembelian bahan.`
              );
            }
          } catch (fifoErr) {
            console.error('[ScanResult] consumeFIFO gagal', fifoErr);
            warning('Peringatan Stok', 'Kain terpakai tapi gagal memotong stok gudang secara otomatis.');
          }
        }
      }

      setShowBahanModal(false);

      // Jika status cutting sudah 'terima' (dari print SPK di CuttingRoom),
      // langsung buka ModalQtySelesai tanpa executeTerima lagi.
      // Jika belum terima (flow manual Terima), panggil executeTerima.
      if (tahap === 'cutting' && currentStatus.status === 'terima') {
        setShowQtyModal(true);
      } else {
        executeTerima(qtyTerimaDefault);
      }
    } finally {
      setIsSubmitting(false);
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

  const handleQtyConfirm = async (qtySelesai: number, alasan: string, needsKoreksiOld: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Semua tahap (termasuk cutting) pakai alur yang sama:
      // diff < 0 → KoreksiKurang, diff > 0 → KoreksiLebih, diff = 0 → Selesai normal
      const qtyTarget = currentStatus.qtyTerima ?? qtyTerimaDefault;
      const diff = qtySelesai - qtyTarget;

      if (diff < 0) {
        setPendingQtySelesai(qtySelesai);
        setShowQtyModal(false);
        setShowKoreksiKurang(true);
        return;
      }

      if (diff > 0) {
        setPendingQtySelesai(qtySelesai);
        setShowQtyModal(false);
        setShowKoreksiLebih(true);
        return;
      }

      // QTY tepat → selesai normal
      await executeSelesai(qtySelesai, null, null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeSelesai = async (
    qtySelesai: number,
    koreksiStatus: 'pending' | null,
    koreksiAlasan: string | null
  ) => {
    const now = new Date().toISOString();
    const operatorId = currentStatus.karyawan || selectedKaryawan;

    // C-05: Blokir jika tahap ini wajib operator tapi belum dipilih
    if (needsKaryawan && (!operatorId || operatorId.trim() === '')) {
      warning(
        'Operator Belum Dipilih',
        `Pilih operator terlebih dahulu sebelum menyelesaikan tahap ${TAHAP_LABEL[tahap]}.`
      );
      return;
    }
    const upahPerPcs = calcNominalPotongan('upah_tahap', tahap, 1);
    const totalUpah = upahPerPcs * qtySelesai;

    // ── STEP 1: UPDATE BUNDLE STATUS ──────────────────────────────────────
    try {
      await updateStatusTahap(bundle.barcode, tahap, {
        status: 'selesai',
        qtySelesai,
        waktuSelesai: now,
        koreksiStatus,
        koreksiAlasan,
        // Simpan karyawan jika belum tercatat (cutting via SPK tidak menyimpan karyawan di step terima)
        ...(operatorId && !currentStatus.karyawan ? { karyawan: operatorId } : {}),
      });
    } catch (error) {
      warning('Gagal', 'Gagal menyimpan status. Coba lagi.');
      return; // Stop — upah belum dicatat, aman
    }

    // ── STEP 2: FINANCE / PAYROLL (Hanya jika Step 1 Berhasil) ────────────
    if (needsKaryawan && operatorId && operatorId.trim() !== '' && qtySelesai > 0) {
      try {
        await usePayrollStore.getState().addLedgerEntry({
          id: `PAY-${Date.now()}-${bundle.barcode}-${tahap}`,
          karyawanId: operatorId,
          tanggal: now,
          keterangan: `Upah ${TAHAP_LABEL[tahap]} - PO: ${bundle.po} (${bundle.barcode})`,
          sumberId: bundle.barcode,
          total: totalUpah,
          tipe: 'selesai',
          status: 'belum_lunas'
        });
      } catch (payrollErr) {
        // Step 1 sudah sukses tapi upah gagal
        console.error('[ScanResult] Gagal catat upah:', payrollErr);
        warning('Peringatan', 'Status tersimpan tapi upah gagal dicatat. Hubungi admin.');
        // Rollback updateStatusTahap (set kembali ke 'terima')
        await updateStatusTahap(bundle.barcode, tahap, {
          status: 'terima',
          qtySelesai: undefined,
        }).catch(() => {
          console.error('[ScanResult] KRITIS: Rollback status gagal');
        });
        return; // Exit
      }
    } else if (needsKaryawan && (!operatorId || operatorId.trim() === '')) {
       // Guard fallback jika data karyawan hilang di tengah jalan
       warning('Data Operator Hilang', 'Status bundle selesai, tapi upah TIDAK dicatat karena identitas operator tidak ditemukan.');
    }

    // ── STEP 3: LOGGING (Non-critical) ─────────────────────────────────────
    try {
      await addRecord({
        id: `SCAN-${Date.now()}`,
        barcode: bundle.barcode,
        po: bundle.po,
        tahap,
        aksi: 'selesai',
        qty: qtySelesai,
        waktu: now
      });
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[ScanResult] Gagal catat log scan:', err);
    }
  };

  const handleKoreksiKurangConfirm = async (result: KoreksiKurangResult) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
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
      const karyawanBertanggungJawab = statusBertanggungjawab?.karyawan ?? null;

      const nominal = calcNominalPotongan(dampakPotongan, tahapBertanggungJawab, qtyKurang);
      const koreksiId = `KOR-${Date.now()}`;

      // C-04: Validasi penanggung jawab (terutama untuk Hilang/Salah Hitung)
      if (nominal > 0 && (!karyawanBertanggungJawab || karyawanBertanggungJawab.trim() === '')) {
        const targetLabel = TAHAP_LABEL[tahapBertanggungJawab as TahapKey] || tahapBertanggungJawab;
        warning(
          'Koreksi Terbatas',
          `Operator penanggung jawab di tahap ${targetLabel} tidak ditemukan. Koreksi akan dicatat tanpa potongan gaji otomatis.`
        );
      }

      // ── STEP 1: DEDUCTION FIRST (Finansial) ──────────────────────────────
      let ledgerEntryId = '';
      if (karyawanBertanggungJawab && nominal > 0) {
        ledgerEntryId = `DED-${Date.now()}-${koreksiId}`;
        try {
          await usePayrollStore.getState().addLedgerEntry({
            id: ledgerEntryId,
            karyawanId: karyawanBertanggungJawab,
            tanggal: now,
            keterangan: `POTONGAN ${result.jenisKoreksi.toUpperCase()} (${TAHAP_LABEL[tahap]}) - ${bundle.barcode}`,
            sumberId: bundle.barcode,
            total: -nominal,
            tipe: 'reject_potong',
            status: 'belum_lunas'
          });
        } catch (err) {
          warning('Gagal Potong Gaji', 'Koreksi dibatalkan karena gagal menghubungi server payroll.');
          return;
        }
      }

      // ── STEP 2: LOG KOREKSI ─────────────────────────────────────────────
      try {
        await addKoreksi({
          id: koreksiId,
          barcode: bundle.barcode,
          poId: bundle.po,
          tahapDitemukan: tahap,
          tahapBertanggungJawab,
          karyawanPelapor: currentUser?.nama || selectedKaryawan || 'SYSTEM',
          karyawanBertanggungJawab,
          jenisKoreksi: result.jenisKoreksi,
          alasanRejectId: result.alasanReject?.id,
          qtyKoreksi: qtyKurang,
          nominalPotongan: nominal,
          statusPotongan: 'pending',
          waktuLapor: now,
        });
      } catch (err) {
        warning('Gagal Koreksi', 'Gagal mencatat koreksi. Potongan upah otomatis dibatalkan.');
        if (ledgerEntryId) {
          const payrollStore = usePayrollStore.getState();
          usePayrollStore.setState({ 
            ledger: payrollStore.ledger.filter(l => l.id !== ledgerEntryId) 
          });
          
          const { error: rollbackError } = await supabase
            .from('gaji_ledger')
            .delete()
            .eq('id', ledgerEntryId);
          
          if (rollbackError) {
            console.error('[ScanResult] KRITIS: Rollback gaji gagal, ID:', ledgerEntryId, rollbackError);
          }
        }
        return;
      }

      await executeSelesai(
        pendingQtySelesai,
        null, // Fixed: Do not block for shortages (Rejects/Lost). Let the remaining pieces move forward.
        result.jenisKoreksi === 'reject'
          ? `Reject: ${result.alasanReject?.nama}`
          : result.jenisKoreksi === 'hilang'
          ? 'Hilang'
          : 'Salah Hitung'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKoreksiLebihConfirm = async (result: KoreksiLebihResult) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const qtyTarget = currentStatus.qtyTerima ?? qtyTerimaDefault;
      const qtyLebih = pendingQtySelesai - qtyTarget;
      const now = new Date().toISOString();

      await addKoreksi({
        id: `KOR-${Date.now()}`,
        barcode: bundle.barcode,
        poId: bundle.po,
        tahapDitemukan: tahap,
        tahapBertanggungJawab: tahap,
        karyawanPelapor: currentUser?.nama || selectedKaryawan || 'SYSTEM',
        karyawanBertanggungJawab: currentStatus.karyawan ?? null,
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
      await executeSelesai(
        qtyTarget,
        'pending',
        `QTY Lebih +${qtyLebih} — Menunggu Approval`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle re-scan perbaikan reject
  const handleSelesaiReScan = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      // Cancel semua koreksi aktif secara paralel — WAJIB di-await
      await Promise.all(
        activeRejectForThisBundle.map(k =>
          useKoreksiStore.getState().cancelKoreksi(k.id)
        )
      );

      const totalQtyPerbaikan = activeRejectForThisBundle.reduce((s, k) => s + k.qtyKoreksi, 0);

      // Catat Upah Perbaikan (Rework) — WAJIB di-await
      const operatorId = currentStatus.karyawan || selectedKaryawan;
      if (operatorId && totalQtyPerbaikan > 0) {
        const upahPerPcs = calcNominalPotongan('upah_tahap', tahap, 1);
        await usePayrollStore.getState().addLedgerEntry({
          id: `RWK-${Date.now()}-${bundle.barcode}`,
          karyawanId: operatorId,
          tanggal: now,
          keterangan: `Upah Perbaikan (Rework) ${TAHAP_LABEL[tahap]} - ${bundle.barcode}`,
          sumberId: bundle.barcode,
          total: upahPerPcs * totalQtyPerbaikan,
          tipe: 'rework',
          status: 'belum_lunas'
        });
      }

      // Update bundle & catat scan (optimistic + fallback)
      try {
        await updateStatusTahap(bundle.barcode, tahap, {
          status: 'selesai',
          qtySelesai: totalQtyPerbaikan,
          waktuSelesai: now,
          koreksiStatus: null,
          koreksiAlasan: null,
        });

        await addRecord({
          id: `SCAN-${Date.now()}`,
          barcode: bundle.barcode,
          po: bundle.po,
          tahap,
          aksi: 'selesai',
          qty: totalQtyPerbaikan,
          waktu: now
        });
        if (onComplete) onComplete();
      } catch (err) {
        warning('Gagal Menyimpan', 'Gagal mencatat data scan perbaikan. Periksa koneksi Anda.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
        <div className={styles.infoItem}>
          <Label color="sub">KODE UNIK</Label>
          <code className={styles.barcode}>{bundle.barcode}</code>
        </div>
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

      {/* Pilih Karyawan — saat status null (tahap lain) ATAU cutting status 'terima' tapi karyawan belum dipilih */}
      {needsKaryawan && (currentStatus.status === null || (tahap === 'cutting' && currentStatus.status === 'terima' && !currentStatus.karyawan)) && (
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

      {/* Info Operator — saat status 'terima' dan karyawan sudah tercatat */}
      {needsKaryawan && currentStatus.status === 'terima' && currentStatus.karyawan && (
        <div className={styles.karyawanField}>
          <Label>Operator Bertugas</Label>
          <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>
            {karyawan.find(k => k.id === currentStatus.karyawan)?.nama || currentStatus.karyawan}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        {/* Tombol Terima: semua tahap termasuk cutting (saat status null) */}
        <Button
          variant="primary"
          onClick={handleTerima}
          disabled={!canTerima || isSubmitting}
        >
          ✅ Terima
        </Button>

        {/* Tombol Selesai: semua tahap saat status === 'terima' */}
        <Button
          variant="secondary"
          onClick={() => {
            // Cutting: SELALU tampilkan modal bahan (pre-fill jika sudah ada data)
            // agar operator dapat mengkonfirmasi pemakaian bahan setiap bundle
            if (tahap === 'cutting') {
              setShowBahanModal(true);
              return;
            }
            setShowQtyModal(true);
          }}
          disabled={
            !canSelesai ||
            isSubmitting ||
            // Cutting: operator wajib dipilih (karena SPK tidak menyimpan karyawan)
            (tahap === 'cutting' && needsKaryawan && !currentStatus.karyawan && !selectedKaryawan)
          }
        >
          🏁 Selesai
        </Button>

        <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={!canReject || isSubmitting}>
          ❌ Reject
        </Button>
      </div>

      <ModalQtySelesai
        open={showQtyModal}
        onClose={() => setShowQtyModal(false)}
        onConfirm={handleQtyConfirm}
        qtyTerima={expectedQty}
        tahap={tahap}
      />

      <ModalReject
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        barcode={bundle.barcode}
        tahap={tahap}
        qtyMax={expectedQty}
      />

      <ModalPemakaianBahan
        open={showBahanModal}
        onClose={() => setShowBahanModal(false)}
        artikelNama={`${modelName} - ${warnaName} - ${sizeName}`}
        poNomor={bundle.po}
        onConfirm={handleBahanConfirm}
        initialData={(() => {
          const existing = getPemakaianBahan(bundle.po, bundle.model, bundle.warna, bundle.size);
          if (!existing) return null;
          return {
            meter: existing.pemakaianKainMeter,
            gram: existing.pemakaianBeratGram,
            inventoryItemId: existing.inventoryItemId || '',
          };
        })()}
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
        qtyKurang={Math.abs(pendingQtySelesai - (currentStatus.qtyTerima ?? qtyTerimaDefault))}
        tahapSaatIni={TAHAP_LABEL[tahap]}
        prevTahapLabel={getPrevTahap(tahap) ? TAHAP_LABEL[getPrevTahap(tahap)!] : undefined}
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