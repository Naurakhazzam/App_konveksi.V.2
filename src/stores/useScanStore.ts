import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

/**
 * ScanRecord — riwayat scan per aksi di station produksi.
 * Interface ini dipakai oleh ScanResult.tsx & ScanStationView.tsx.
 * (Berbeda dari production.types.ts ScanRecord yang dipakai useSerahTerimaStore)
 */
export interface ScanRecord {
  id: string;
  barcode: string;
  po: string;
  tahap: string;
  aksi: 'terima' | 'selesai' | 'reject';
  qty: number;
  waktu: string;
}

interface ScanState {
  history: ScanRecord[];
  isLoading: boolean;

  loadScanHistory: () => Promise<void>;
  addRecord: (record: ScanRecord) => Promise<void>;
  getHistoryByStage: (tahap: string) => ScanRecord[];
  clearHistory: () => void;
}

// ── Helper: DB row → ScanRecord ───────────────────────────────────────────────

function mapScan(row: any): ScanRecord {
  return {
    id: row.id,
    barcode: row.barcode,
    po: row.po ?? '',
    tahap: row.tahap,
    aksi: row.aksi,
    qty: Number(row.qty ?? 0),
    waktu: row.waktu ?? row.created_at ?? '',
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useScanStore = create<ScanState>((set, get) => ({
  history: [],
  isLoading: false,

  // ── LOAD (ambil 200 history terbaru) ──────────────────────────────────────

  loadScanHistory: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      set({ history: (data ?? []).map(mapScan), isLoading: false });
    } catch (err) {
      console.error('[useScanStore] loadScanHistory error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD RECORD (optimistic + fire-and-forget ke DB) ───────────────────────

  addRecord: async (record) => {
    // Pola standar project
    const backup = get().history;
    set((state) => ({
      history: [record, ...state.history].slice(0, 200),
    }));

    try {
      const { error } = await supabase.from('scan_history').insert({
        id: record.id,
        barcode: record.barcode,
        po: record.po,
        tahap: record.tahap,
        aksi: record.aksi,
        qty: record.qty,
        waktu: record.waktu,
      });
      if (error) throw error;
    } catch (err) {
      set({ history: backup }); // rollback UI
      throw err;                // lempar error
    }
  },

  // ── GETTERS ───────────────────────────────────────────────────────────────

  getHistoryByStage: (tahap) =>
    get().history.filter((r) => r.tahap === tahap),

  // ── CLEAR (hanya clear state lokal, data DB tetap) ────────────────────────

  clearHistory: () => set({ history: [] }),
}));
