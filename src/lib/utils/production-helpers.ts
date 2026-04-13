import { Bundle, StatusTahap, KoreksiQTY } from '@/types';

export type TahapKey = 'cutting' | 'jahit' | 'lkancing' | 'bbenang' | 'qc' | 'steam' | 'packing';

export const TAHAP_ORDER: TahapKey[] = [
  'cutting', 'jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing'
];

export const TAHAP_LABEL: Record<TahapKey, string> = {
  cutting: 'Cutting',
  jahit: 'Jahit',
  lkancing: 'Lubang Kancing',
  bbenang: 'Buang Benang',
  qc: 'QC',
  steam: 'Steam',
  packing: 'Packing',
};

export const SLUG_TO_KEY: Record<string, TahapKey> = {
  'cutting': 'cutting',
  'jahit': 'jahit',
  'lubang-kancing': 'lkancing',
  'buang-benang': 'bbenang',
  'qc': 'qc',
  'steam': 'steam',
  'packing': 'packing',
};

export const KEY_TO_SLUG: Record<TahapKey, string> = {
  cutting: 'cutting',
  jahit: 'jahit',
  lkancing: 'lubang-kancing',
  bbenang: 'buang-benang',
  qc: 'qc',
  steam: 'steam',
  packing: 'packing',
};

export const REQUIRES_KARYAWAN: TahapKey[] = ['cutting', 'jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing'];

/** Ambil tahap sebelumnya */
export function getPrevTahap(tahap: TahapKey): TahapKey | null {
  const idx = TAHAP_ORDER.indexOf(tahap);
  return idx > 0 ? TAHAP_ORDER[idx - 1] : null;
}

export interface ValidationResult {
  canTerima: boolean;
  blockReason: string | null;
}

/** Validasi apakah bundle bisa di-TERIMA di tahap ini */
export function validateCanTerima(bundle: Bundle, tahap: TahapKey): ValidationResult {
  const prevTahap = getPrevTahap(tahap);

  // Cek koreksi pending di tahap sebelumnya
  for (const t of TAHAP_ORDER) {
    if (t === tahap) break;
    if (bundle.statusTahap[t].koreksiStatus === 'pending') {
      return { canTerima: false, blockReason: `Bundle diblokir: ada koreksi pending di tahap ${TAHAP_LABEL[t]}` };
    }
  }

  // Tahap pertama (cutting) langsung bisa
  if (!prevTahap) {
    const current = bundle.statusTahap[tahap];
    if (current.status === 'terima' || current.status === 'selesai') {
      return { canTerima: false, blockReason: 'Bundle sudah diterima di tahap ini' };
    }
    return { canTerima: true, blockReason: null };
  }

  // Cek tahap sebelumnya harus selesai
  const prev = bundle.statusTahap[prevTahap];
  if (prev.status !== 'selesai') {
    return { canTerima: false, blockReason: `Tahap ${TAHAP_LABEL[prevTahap]} belum selesai` };
  }

  // Cek status tahap ini
  const current = bundle.statusTahap[tahap];
  if (current.status === 'terima' || current.status === 'selesai') {
    return { canTerima: false, blockReason: 'Bundle sudah diterima di tahap ini' };
  }

  return { canTerima: true, blockReason: null };
}

/** QTY terima maksimum = qtySelesai tahap sebelumnya, atau qtyBundle jika cutting */
export function getQtyTerima(bundle: Bundle, tahap: TahapKey): number {
  const prevTahap = getPrevTahap(tahap);
  if (!prevTahap) return bundle.qtyBundle;
  return bundle.statusTahap[prevTahap].qtySelesai ?? 0;
}

/** Cek semua tahap, return status icon */
export function getTahapStatusIcon(status: StatusTahap['status']): string {
  if (status === 'selesai') return '✅';
  if (status === 'terima') return '⏳';
  return '⬜';
}
/** Hitung progress per PO per tahap */
export function getProgressByPO(bundles: Bundle[], poId: string, tahap: TahapKey) {
  const poBundles = bundles.filter(b => b.po === poId);
  if (poBundles.length === 0) return { done: 0, total: 0, pct: 0 };
  
  const doneCount = poBundles.filter(b => b.statusTahap[tahap].status === 'selesai').length;
  return {
    done: doneCount,
    total: poBundles.length,
    pct: (doneCount / poBundles.length) * 100
  };
}

/** Hitung progress per artikel per tahap */
export function getProgressByArtikel(
  bundles: Bundle[], 
  poId: string, 
  modelId: string, 
  warnaId: string, 
  sizeId: string, 
  tahap: TahapKey
) {
  const artBundles = bundles.filter(b => 
    b.po === poId && 
    b.model === modelId && 
    b.warna === warnaId && 
    b.size === sizeId
  );
  
  if (artBundles.length === 0) return { done: 0, total: 0, pct: 0 };
  
  const doneCount = artBundles.filter(b => b.statusTahap[tahap].status === 'selesai').length;
  return {
    done: doneCount,
    total: artBundles.length,
    pct: (doneCount / artBundles.length) * 100
  };
}

export interface WarningData {
  id: string;
  barcode: string;
  po: string;
  tahap: TahapKey;
  jenis: 'koreksi' | 'mandek' | 'kurang';
  detail: string;
  waktu: string;
}

/** Ambil semua warnings dari bundles */
export function getWarnings(bundles: Bundle[], stuckThresholdHours: number = 24): WarningData[] {
  const warnings: WarningData[] = [];
  const now = new Date().getTime();
  const thresholdMs = stuckThresholdHours * 60 * 60 * 1000;

  bundles.forEach(b => {
    TAHAP_ORDER.forEach(t => {
      const st = b.statusTahap[t];
      
      // 1. Koreksi Pending
      if (st.koreksiStatus === 'pending') {
        warnings.push({
          id: `${b.barcode}-${t}-koreksi`,
          barcode: b.barcode,
          po: b.po,
          tahap: t,
          jenis: 'koreksi',
          detail: 'Menunggu approval owner (QTY > Target)',
          waktu: st.waktuSelesai || ''
        });
      }

      // 2. Mandek (> threshold di status 'terima')
      if (st.status === 'terima' && st.waktuTerima) {
        const waktuTerima = new Date(st.waktuTerima).getTime();
        if (now - waktuTerima > thresholdMs) {
          warnings.push({
            id: `${b.barcode}-${t}-mandek`,
            barcode: b.barcode,
            po: b.po,
            tahap: t,
            jenis: 'mandek',
            detail: `Sudah >${stuckThresholdHours} jam belum diselesaikan`,
            waktu: st.waktuTerima
          });
        }
      }

      // 3. QTY Kurang (selesai < terima)
      if (st.status === 'selesai' && (st.qtySelesai ?? 0) < (st.qtyTerima ?? 0)) {
        warnings.push({
          id: `${b.barcode}-${t}-kurang`,
          barcode: b.barcode,
          po: b.po,
          tahap: t,
          jenis: 'kurang',
          detail: `QTY kurang ${(st.qtyTerima ?? 0) - (st.qtySelesai ?? 0)} pcs (${st.koreksiAlasan || 'Tanpa alasan'})`,
          waktu: st.waktuSelesai || ''
        });
      }
    });
  });

  return warnings;
}

/**
 * Hitung QTY expected di setiap tahap, mempertimbangkan semua koreksi yang sudah terjadi.
 * - Koreksi kurang yang masih 'pending' / 'applied' mengurangi QTY.
 * - Koreksi kurang yang 'cancelled' (sudah diperbaiki) tidak mengurangi QTY.
 * - Koreksi lebih yang sudah 'approved' menambah QTY.
 */
export function getExpectedQTY(
  bundle: Bundle,
  tahap: TahapKey,
  koreksiList: KoreksiQTY[]
): number {
  let qty = bundle.qtyBundle;
  const tahapIndex = TAHAP_ORDER.indexOf(tahap);

  for (let i = 0; i < tahapIndex; i++) {
    const prevTahap = TAHAP_ORDER[i];

    const koreksiKurang = koreksiList.filter(
      (k) =>
        k.barcode === bundle.barcode &&
        k.tahapDitemukan === prevTahap &&
        k.jenisKoreksi !== 'lebih' &&
        k.statusPotongan !== 'cancelled'
    );
    koreksiKurang.forEach((k) => (qty -= k.qtyKoreksi));

    const koreksiLebih = koreksiList.filter(
      (k) =>
        k.barcode === bundle.barcode &&
        k.tahapDitemukan === prevTahap &&
        k.jenisKoreksi === 'lebih' &&
        k.statusApproval === 'approved'
    );
    koreksiLebih.forEach((k) => (qty += k.qtyKoreksi));
  }

  return Math.max(0, qty);
}

/** Total bundle yang sudah selesai packing */
export function getTotalCompleted(bundles: Bundle[], poId: string): number {
  return bundles.filter(b => b.po === poId && b.statusTahap.packing.status === 'selesai').length;
}

export type FlowBoxType = 'waiting' | 'process' | 'antri' | 'kirim';

/** Filter bundle berdasarkan posisi di flow bar */
export function getBundlesByFlowState(
  bundles: Bundle[], 
  stage: TahapKey | 'antri' | 'kirim', 
  type: 'selesai' | 'proses' // selesai = top box (waiting), proses = bottom box
): Bundle[] {
  if (stage === 'antri') {
    return bundles.filter(b => b.statusTahap.cutting.status === null);
  }
  
  if (stage === 'kirim') {
    // Only bundles that are already in a Shipment
    return bundles.filter(b => !!b.suratJalanId);
  }

  const currentStage = stage as TahapKey;
  const nextStage = TAHAP_ORDER[TAHAP_ORDER.indexOf(currentStage) + 1] as TahapKey | undefined;

  if (type === 'selesai') {
    // Selesai di stage ini tapi belum di-terima di stage selanjutnya
    return bundles.filter(b => {
      const st = b.statusTahap[currentStage];
      if (st.status !== 'selesai') return false;
      
      if (!nextStage) {
        // For packing, "selesai" (top box) means finished packing BUT not yet shipped
        return !b.suratJalanId;
      }
      
      return b.statusTahap[nextStage].status === null;
    });
  } else {
    // Sedang dikerjakan di stage ini
    return bundles.filter(b => b.statusTahap[currentStage].status === 'terima');
  }
}

/** Ringkasan masalah (reject/hilang) untuk suatu bundle */
export function getBundleIssueSummary(barcode: string, koreksiList: KoreksiQTY[]): string {
  const issues = koreksiList.filter(k => k.barcode === barcode && k.jenisKoreksi !== 'lebih' && k.statusPotongan !== 'cancelled');
  if (issues.length === 0) return '';
  
  return issues.map(k => {
    const tahap = TAHAP_LABEL[k.tahapDitemukan as TahapKey] || k.tahapDitemukan;
    return `${k.qtyKoreksi} pcs (${tahap}: ${k.jenisKoreksi})`;
  }).join(', ');
}
