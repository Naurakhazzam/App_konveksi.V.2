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
    upahLunas: number;
    kasbonSisa: number;
    totalEscrow: number;
    escrowEntries: GajiLedgerEntry[];
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

      set({ 
        ledger: (ledgerRes.data ?? []).map(mapLedger), 
        kasbon: (kasbonRes.data ?? []).map(mapKasbon), 
        isLoading: false 
      });
    } catch (err) {
      console.error('[usePayrollStore] loadPayroll error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD LEDGER ENTRY ──────────────────────────────────────────────────────
  addLedgerEntry: async (entry: GajiLedgerEntry) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[usePayrollStore] addLedgerEntry ditolak: Session user tidak ditemukan.');
      return;
    }

    if (!entry.karyawanId || entry.karyawanId.trim() === '') {
      console.error('[usePayrollStore] addLedgerEntry dibatalkan: karyawanId kosong.', entry);
      return;
    }

    const { karyawan } = useMasterStore.getState();
    if (!karyawan.find(k => k.id === entry.karyawanId)) {
      console.error(`[usePayrollStore] addLedgerEntry dibatalkan: karyawanId "${entry.karyawanId}" tidak ditemukan.`, entry);
      return;
    }

    const backup = get().ledger;
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
      set({ ledger: backup });
      throw err;
    }
  },

  // ── CALCULATE UPAH ────────────────────────────────────────────────────────
  calculateUpah: (karyawanId: string, startDate?: string, endDate?: string) => {
    let entries = get().ledger.filter((l) => l.karyawanId === karyawanId);

    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      entries = entries.filter((e) => {
        const time = new Date(e.tanggal).getTime();
        return time >= start && time <= end;
      });
    }

    let upah = 0, potongan = 0, rework = 0, upahLunas = 0, totalEscrow = 0;
    const escrowEntries: GajiLedgerEntry[] = [];

    entries.forEach((e) => {
      if (e.status === 'escrow') {
        totalEscrow += e.total;
        escrowEntries.push(e);
        return;
      }
      if (e.status === 'belum_lunas') {
        if (e.tipe === 'selesai') upah += e.total;
        if (e.tipe === 'reject_potong') potongan += Math.abs(e.total);
        if (e.tipe === 'rework') rework += e.total;
      }
      if (e.status === 'lunas') {
        if (e.tipe === 'selesai') upahLunas += e.total;
        if (e.tipe === 'reject_potong') upahLunas -= Math.abs(e.total);
        if (e.tipe === 'rework') upahLunas += e.total;
      }
    });

    const karyawanObj = useMasterStore.getState().karyawan.find((k) => k.id === karyawanId);
    return {
      upah, potongan, rework,
      gajiPokok: karyawanObj?.gajiPokok || 0,
      upahBersih: upah - potongan + rework,
      upahLunas, totalEscrow, escrowEntries,
      kasbonSisa: get().getSisaKasbon(karyawanId),
      entries,
    };
  },

  getSisaKasbon: (karyawanId: string) =>
    get().kasbon.filter((k) => k.karyawanId === karyawanId)
      .reduce((acc, curr) => acc + (curr.status === 'belum_lunas' ? curr.jumlah : 0), 0),

  // ── PROSES BAYAR (Atomik via RPC) ─────────────────────────────────────────
  prosesBayar: async (karyawanId: string, entryIds: string[], inputKasbon: number, hariKerja?: number) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const tanggalBayar = new Date().toISOString();
    const upahData = get().calculateUpah(karyawanId);
    const gajiPokokProrata = Math.round((upahData.gajiPokok / 6) * (hariKerja || 0));
    const totalBersihPay = (upahData.upahBersih + gajiPokokProrata) - inputKasbon;

    const gapokEntry: GajiLedgerEntry | null = gajiPokokProrata > 0 ? {
      id: `GP-${Date.now()}-${karyawanId}`,
      karyawanId,
      tanggal: tanggalBayar,
      keterangan: `Gaji Pokok (${hariKerja}/6 hari)`,
      sumberId: 'SYSTEM',
      total: gajiPokokProrata,
      tipe: 'selesai',
      status: 'lunas',
      isPrinted: false,
      tanggalBayar
    } : null;

    const newKasbonEntry: KasbonEntry | null = inputKasbon > 0 ? {
      id: `KSB-PYMT-${Date.now()}`,
      karyawanId,
      jumlah: -inputKasbon,
      tanggal: tanggalBayar,
      keterangan: 'Potongan pembayaran gaji',
      status: 'lunas',
    } : null;

    const jurnalRow = totalBersihPay > 0 ? {
      id: `JUR-PAY-${Date.now()}`,
      kategori: 'KTR-002',
      jenis: 'direct_upah',
      tipe: 'keluar',
      nominal: totalBersihPay,
      keterangan: `Pembayaran Gaji Karyawan: ${karyawanId}`,
      tanggal: tanggalBayar.split('T')[0],
    } : null;

    const backup = { ledger: get().ledger, kasbon: get().kasbon };
    set((state) => ({
      ledger: [
        ...(gapokEntry ? [gapokEntry] : []),
        ...state.ledger.map((l) =>
          entryIds.includes(l.id) ? { ...l, status: 'lunas' as const, tanggalBayar } : l
        )
      ],
      kasbon: newKasbonEntry ? [...state.kasbon, newKasbonEntry] : state.kasbon,
    }));

    try {
      const { error } = await supabase.rpc('pay_salary_atomic', {
        p_karyawan_id: karyawanId,
        p_ledger_ids: entryIds,
        p_tanggal_bayar: tanggalBayar,
        p_gapok_row: gapokEntry ? {
          id: gapokEntry.id, karyawan_id: gapokEntry.karyawanId, 
          tipe: gapokEntry.tipe, total: gapokEntry.total,
          tanggal: gapokEntry.tanggal, sumber_id: gapokEntry.sumberId,
          keterangan: gapokEntry.keterangan, status: gapokEntry.status
        } : null,
        p_kasbon_row: newKasbonEntry ? {
          id: newKasbonEntry.id, karyawan_id: newKasbonEntry.karyawanId,
          jumlah: newKasbonEntry.jumlah, tanggal: newKasbonEntry.tanggal,
          keterangan: newKasbonEntry.keterangan, status: newKasbonEntry.status
        } : null,
        p_jurnal_row: jurnalRow
      });

      if (error) throw error;

      useLogStore.getState().addLog({
        user: { id: currentUser.id, nama: currentUser.nama, role: currentUser.roles[0] || 'User' },
        modul: 'penggajian',
        aksi: 'Bayar Gaji (Atomic)',
        target: karyawanId,
        metadata: { hariKerja, totalUpah: upahData.upahBersih, potongKasbon: inputKasbon, netto: totalBersihPay }
      });
    } catch (err) {
      console.error('[usePayrollStore] prosesBayar failed:', err);
      set(backup);
      throw err;
    }
  },

  setSlipPrinted: async (entryIds: string[]) => {
    const backup = get().ledger;
    set((state) => ({
      ledger: state.ledger.map((l) => entryIds.includes(l.id) ? { ...l, isPrinted: true } : l),
    }));
    try {
      const { error } = await supabase.from('gaji_ledger').update({ is_printed: true }).in('id', entryIds);
      if (error) throw error;
    } catch (err) {
      console.error('[usePayrollStore] setSlipPrinted error:', err);
      set({ ledger: backup });
    }
  },

  addKasbon: async (kasbon: KasbonEntry) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const backup = get().kasbon;
    set((state) => ({ kasbon: [...state.kasbon, kasbon] }));
    try {
      const { error } = await supabase.from('kasbon').insert({
        id: kasbon.id, karyawan_id: kasbon.karyawanId, jumlah: kasbon.jumlah,
        tanggal: kasbon.tanggal, keterangan: kasbon.keterangan,
        status: kasbon.status, lunas: kasbon.status === 'lunas',
      });
      if (error) throw error;

      useLogStore.getState().addLog({
        user: { id: currentUser.id, nama: currentUser.nama, role: currentUser.roles[0] || 'User' },
        modul: 'penggajian', aksi: 'Tambah Kasbon', target: kasbon.karyawanId,
        metadata: { nominal: kasbon.jumlah },
      });
    } catch (err) {
      console.error('[usePayrollStore] addKasbon error:', err);
      set({ kasbon: backup });
    }
  },

  activateEscrowByBarcode: async (barcode: string) => {
    const backup = get().ledger;
    set((state) => ({
      ledger: state.ledger.map((l) =>
        l.sumberId === barcode && l.status === 'escrow' ? { ...l, status: 'belum_lunas' as const } : l
      ),
    }));
    try {
      const { error } = await supabase.from('gaji_ledger')
        .update({ status: 'belum_lunas', lunas: false })
        .eq('sumber_id', barcode).eq('status', 'escrow');
      if (error) throw error;
    } catch (err) {
      console.error('[usePayrollStore] activateEscrowByBarcode error:', err);
      set({ ledger: backup });
    }
  },
}));
