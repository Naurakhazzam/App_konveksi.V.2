import { create } from 'zustand';
import { GajiLedgerEntry, KasbonEntry } from '../types';
import { supabase } from '@/lib/supabase';
import { useLogStore } from './useLogStore';
import { useAuthStore } from './useAuthStore';
import { useJurnalStore } from './useJurnalStore';
import { useMasterStore } from './useMasterStore';

interface PayrollState {
  ledger: GajiLedgerEntry[];
  kasbon: KasbonEntry[];
  isLoading: boolean;

  loadPayroll: () => Promise<void>;
  addLedgerEntry: (entry: GajiLedgerEntry) => Promise<void>;
  calculateUpah: (karyawanId: string, startDate?: string, endDate?: string) => {
    upah: number;
    potongan: number;
    rework: number;
    gajiPokok: number;
    upahBersih: number;
    kasbonSisa: number;
    entries: GajiLedgerEntry[];
  };
  prosesBayar: (karyawanId: string, entryIds: string[], inputKasbon: number, hariKerja?: number) => Promise<void>;
  setSlipPrinted: (entryIds: string[]) => Promise<void>;
  addKasbon: (kasbon: KasbonEntry) => Promise<void>;
  getSisaKasbon: (karyawanId: string) => number;
  activateEscrowByBarcode: (barcode: string) => Promise<void>;
}

// ── Helper: DB → TypeScript ──────────────────────────────────────────────────

function mapLedger(row: any): GajiLedgerEntry {
  return {
    id: row.id,
    karyawanId: row.karyawan_id,
    tipe: row.tipe,
    total: Number(row.total ?? row.jumlah ?? 0),
    tanggal: row.tanggal ?? '',
    sumberId: row.sumber_id ?? row.bundle_id ?? '',
    keterangan: row.keterangan ?? '',
    status: (row.status ?? (row.lunas ? 'lunas' : 'belum_lunas')) as GajiLedgerEntry['status'],
    tanggalBayar: row.tanggal_bayar ?? undefined,
    isPrinted: row.is_printed ?? false,
  };
}

function mapKasbon(row: any): KasbonEntry {
  return {
    id: row.id,
    karyawanId: row.karyawan_id,
    jumlah: Number(row.jumlah ?? 0),
    tanggal: row.tanggal ?? '',
    keterangan: row.keterangan ?? '',
    status: (row.status ?? (row.lunas ? 'lunas' : 'belum_lunas')) as KasbonEntry['status'],
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const usePayrollStore = create<PayrollState>((set, get) => ({
  ledger: [],
  kasbon: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadPayroll: async () => {
    set({ isLoading: true });
    try {
      const [ledgerRes, kasbonRes] = await Promise.all([
        supabase.from('gaji_ledger').select('*').order('tanggal', { ascending: false }),
        supabase.from('kasbon').select('*').order('tanggal', { ascending: false }),
      ]);

      if (ledgerRes.error) throw ledgerRes.error;

      const ledger = (ledgerRes.data ?? []).map(mapLedger);
      const kasbon = (kasbonRes.data ?? []).map(mapKasbon);

      set({ ledger, kasbon, isLoading: false });
    } catch (err) {
      console.error('[usePayrollStore] loadPayroll error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD LEDGER ENTRY ──────────────────────────────────────────────────────

  addLedgerEntry: async (entry) => {
    set((state) => ({ ledger: [...state.ledger, entry] }));
    try {
      const { error } = await supabase.from('gaji_ledger').insert({
        id: entry.id,
        karyawan_id: entry.karyawanId,
        tipe: entry.tipe,
        total: entry.total,
        jumlah: entry.total,
        tanggal: entry.tanggal,
        sumber_id: entry.sumberId,
        bundle_id: entry.sumberId ?? null,
        keterangan: entry.keterangan,
        status: entry.status,
        lunas: entry.status === 'lunas',
        tanggal_bayar: entry.tanggalBayar ?? null,
        is_printed: entry.isPrinted ?? false,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[usePayrollStore] addLedgerEntry error:', err);
      set((state) => ({ ledger: state.ledger.filter((l) => l.id !== entry.id) }));
    }
  },

  // ── CALCULATE UPAH (pure logic, tidak ada side effect DB) ────────────────

  calculateUpah: (karyawanId, startDate, endDate) => {
    let entries = get().ledger.filter(
      (l) => l.karyawanId === karyawanId && l.status !== 'escrow'
    );

    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      entries = entries.filter((e) => {
        const time = new Date(e.tanggal).getTime();
        return time >= start && time <= end;
      });
    }

    let upah = 0;
    let potongan = 0;
    let rework = 0;

    entries.forEach((e) => {
      if (e.tipe === 'selesai') upah += e.total;
      if (e.tipe === 'reject_potong') potongan += Math.abs(e.total);
      if (e.tipe === 'rework') rework += e.total;
    });

    const karyawanObj = useMasterStore.getState().karyawan.find((k) => k.id === karyawanId);
    const gajiPokok = karyawanObj?.gajiPokok || 0;
    const kasbonSisa = get().getSisaKasbon(karyawanId);

    return {
      upah,
      potongan,
      rework,
      gajiPokok,
      upahBersih: upah - potongan + rework + gajiPokok,
      kasbonSisa,
      entries,
    };
  },

  // ── SISA KASBON ───────────────────────────────────────────────────────────

  getSisaKasbon: (karyawanId) =>
    get()
      .kasbon.filter((k) => k.karyawanId === karyawanId)
      .reduce((acc, curr) => acc + (curr.status === 'belum_lunas' ? curr.jumlah : 0), 0),

  // ── PROSES BAYAR (Atomik) ─────────────────────────────────────────────────

  prosesBayar: async (karyawanId, entryIds, inputKasbon, hariKerja) => {
    const tanggalBayar = new Date().toISOString();
    const upahData = get().calculateUpah(karyawanId);

    // 1. Optimistic update lokal
    const newKasbonEntry: KasbonEntry | null =
      inputKasbon > 0
        ? {
            id: `KSB-PYMT-${Date.now()}`,
            karyawanId,
            jumlah: -inputKasbon,
            tanggal: tanggalBayar,
            keterangan: 'Potongan pembayaran gaji',
            status: 'lunas',
          }
        : null;

    set((state) => ({
      ledger: state.ledger.map((l) =>
        entryIds.includes(l.id) ? { ...l, status: 'lunas' as const, tanggalBayar } : l
      ),
      kasbon: newKasbonEntry
        ? [...state.kasbon, newKasbonEntry]
        : state.kasbon,
    }));

    try {
      // 2. Update status ledger di Supabase secara paralel
      await Promise.all([
        supabase
          .from('gaji_ledger')
          .update({ status: 'lunas', lunas: true, tanggal_bayar: tanggalBayar })
          .in('id', entryIds),

        // 3. Insert kasbon potongan jika ada
        ...(newKasbonEntry
          ? [
              supabase.from('kasbon').insert({
                id: newKasbonEntry.id,
                karyawan_id: newKasbonEntry.karyawanId,
                jumlah: newKasbonEntry.jumlah,
                tanggal: newKasbonEntry.tanggal,
                keterangan: newKasbonEntry.keterangan,
                status: newKasbonEntry.status,
                lunas: true,
              }),
            ]
          : []),
      ]);
    } catch (err) {
      console.error('[usePayrollStore] prosesBayar error:', err);
    }

    // 4. Catat ke Jurnal Umum
    const totalBersihPay = upahData.upahBersih - inputKasbon;
    if (totalBersihPay > 0) {
      await useJurnalStore.getState().addEntry({
        id: `JUR-PAY-${Date.now()}`,
        kategoriTrxId: 'KTR-002',
        tanggal: tanggalBayar,
        keterangan: `Pembayaran Gaji Karyawan: ${karyawanId}`,
        nominal: totalBersihPay,
        jenis: 'direct_upah',
      });
    }

    // 5. Log aktivitas
    const user = useAuthStore.getState().currentUser;
    if (user) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
        modul: 'penggajian',
        aksi: 'Bayar Gaji',
        target: karyawanId,
        metadata: {
          hariKerja: hariKerja || 6,
          totalUpah: upahData.upahBersih,
          potongKasbon: inputKasbon,
          netto: totalBersihPay,
        },
      });
    }
  },

  // ── SET SLIP PRINTED ──────────────────────────────────────────────────────

  setSlipPrinted: async (entryIds) => {
    set((state) => ({
      ledger: state.ledger.map((l) =>
        entryIds.includes(l.id) ? { ...l, isPrinted: true } : l
      ),
    }));
    try {
      const { error } = await supabase
        .from('gaji_ledger')
        .update({ is_printed: true })
        .in('id', entryIds);
      if (error) throw error;
    } catch (err) {
      console.error('[usePayrollStore] setSlipPrinted error:', err);
    }
  },

  // ── ADD KASBON ────────────────────────────────────────────────────────────

  addKasbon: async (kasbon) => {
    set((state) => ({ kasbon: [...state.kasbon, kasbon] }));
    try {
      const { error } = await supabase.from('kasbon').insert({
        id: kasbon.id,
        karyawan_id: kasbon.karyawanId,
        jumlah: kasbon.jumlah,
        tanggal: kasbon.tanggal,
        keterangan: kasbon.keterangan,
        status: kasbon.status,
        lunas: kasbon.status === 'lunas',
      });
      if (error) throw error;
    } catch (err) {
      console.error('[usePayrollStore] addKasbon error:', err);
      set((state) => ({ kasbon: state.kasbon.filter((k) => k.id !== kasbon.id) }));
    }

    const user = useAuthStore.getState().currentUser;
    if (user) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
        modul: 'penggajian',
        aksi: 'Tambah Kasbon',
        target: kasbon.karyawanId,
        metadata: { nominal: kasbon.jumlah },
      });
    }
  },

  // ── ACTIVATE ESCROW ───────────────────────────────────────────────────────

  activateEscrowByBarcode: async (barcode) => {
    set((state) => ({
      ledger: state.ledger.map((l) =>
        l.sumberId === barcode && l.status === 'escrow'
          ? { ...l, status: 'belum_lunas' as const }
          : l
      ),
    }));
    try {
      const { error } = await supabase
        .from('gaji_ledger')
        .update({ status: 'belum_lunas', lunas: false })
        .eq('sumber_id', barcode)
        .eq('status', 'escrow');
      if (error) throw error;
    } catch (err) {
      console.error('[usePayrollStore] activateEscrowByBarcode error:', err);
    }
  },
}));
