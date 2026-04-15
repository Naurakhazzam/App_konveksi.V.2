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
    // 1. Audit Trail: Siapa yang membuat entri ini?
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[usePayrollStore] addLedgerEntry ditolak: Session user tidak ditemukan.');
      return;
    }

    // 2. Validasi: karyawanId wajib ada dan valid di master karyawan
    if (!entry.karyawanId || entry.karyawanId.trim() === '') {
      console.error('[usePayrollStore] addLedgerEntry dibatalkan: karyawanId kosong.', entry);
      return;
    }
    const { karyawan } = useMasterStore.getState();
    const karyawanValid = karyawan.find(k => k.id === entry.karyawanId);
    if (!karyawanValid) {
      console.error(`[usePayrollStore] addLedgerEntry dibatalkan: karyawanId "${entry.karyawanId}" tidak ditemukan di master.`, entry);
      return;
    }

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
      // Rollback optimistic update
      set((state) => ({ ledger: state.ledger.filter((l) => l.id !== entry.id) }));
      // Re-throw agar caller bisa mendeteksi kegagalan dan notifikasi user
      throw err;
    }
  },

  // ── CALCULATE UPAH (pure logic, tidak ada side effect DB) ────────────────

  calculateUpah: (karyawanId, startDate, endDate) => {
    // Ambil SEMUA entri untuk rentang tanggal ini (termasuk lunas, escrow, dsb)
    let entries = get().ledger.filter((l) => l.karyawanId === karyawanId);

    if (startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      entries = entries.filter((e) => {
        const time = new Date(e.tanggal).getTime();
        return time >= start && time <= end;
      });
    }

    let upah = 0;
    let potongan = 0;
    let rework = 0;
    let upahLunas = 0; // NEW: untuk history/slip
    let totalEscrow = 0;
    const escrowEntries: GajiLedgerEntry[] = [];

    entries.forEach((e) => {
      // L-03: Pisahkan Escrow
      if (e.status === 'escrow') {
        totalEscrow += e.total;
        escrowEntries.push(e);
        return;
      }

      // L-02: Untuk rekap upah bersih (yang bisa dicairkan), hanya hitung yang 'belum_lunas'
      if (e.status === 'belum_lunas') {
        if (e.tipe === 'selesai') upah += e.total;
        if (e.tipe === 'reject_potong') potongan += Math.abs(e.total);
        if (e.tipe === 'rework') rework += e.total;
      }

      // Untuk history slip gaji
      if (e.status === 'lunas') {
        if (e.tipe === 'selesai') upahLunas += e.total;
        if (e.tipe === 'reject_potong') upahLunas -= Math.abs(e.total);
        if (e.tipe === 'rework') upahLunas += e.total;
      }
    });

    const karyawanObj = useMasterStore.getState().karyawan.find((k) => k.id === karyawanId);
    const gajiPokok = karyawanObj?.gajiPokok || 0;
    const kasbonSisa = get().getSisaKasbon(karyawanId);

    return {
      upah,
      potongan,
      rework,
      gajiPokok,
      upahBersih: upah - potongan + rework,
      upahLunas, // Untuk Slip Gaji
      totalEscrow,
      escrowEntries,
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
    // 1. Audit Trail: Siapa yang melakukan transaksi keuangan ini?
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[usePayrollStore] prosesBayar ditolak: Session user tidak ditemukan.');
      return;
    }

    const tanggalBayar = new Date().toISOString();
    const upahData = get().calculateUpah(karyawanId);
    const gajiPokokHarian = upahData.gajiPokok / 6;
    const gajiPokokProrata = Math.round(gajiPokokHarian * (hariKerja || 0));

    // 1. Tentukan total bersih (Borongan + Gapok - Kasbon)
    const totalBersihPay = (upahData.upahBersih + gajiPokokProrata) - inputKasbon;

    // 2. Buat entri Gapok di Ledger (agar tercatat permanen)
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

    // 3. Optimistic update lokal
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
      ledger: [
        ...(gapokEntry ? [gapokEntry] : []),
        ...state.ledger.map((l) =>
          entryIds.includes(l.id) ? { ...l, status: 'lunas' as const, tanggalBayar } : l
        )
      ],
      kasbon: newKasbonEntry ? [...state.kasbon, newKasbonEntry] : state.kasbon,
    }));

    try {
      // 4. Update status ledger & Insert Gapok di Supabase secara paralel
      await Promise.all([
        supabase
          .from('gaji_ledger')
          .update({ status: 'lunas', lunas: true, tanggal_bayar: tanggalBayar })
          .in('id', entryIds),

        ...(gapokEntry ? [
          supabase.from('gaji_ledger').insert({
            id: gapokEntry.id,
            karyawan_id: gapokEntry.karyawanId,
            tipe: gapokEntry.tipe,
            total: gapokEntry.total,
            tanggal: gapokEntry.tanggal,
            sumber_id: gapokEntry.sumberId,
            keterangan: gapokEntry.keterangan,
            status: gapokEntry.status,
            lunas: true,
            tanggal_bayar: tanggalBayar,
          })
        ] : []),

        // 5. Insert kasbon potongan jika ada
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

    // 6. Catat ke Jurnal Umum
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

    // 7. Log aktivitas — Sekarang menggunakan user dari session
    useLogStore.getState().addLog({
      user: { id: currentUser.id, nama: currentUser.nama, role: currentUser.roles[0] || 'User' },
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
    // Audit Trail
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[usePayrollStore] addKasbon ditolak: Session user tidak ditemukan.');
      return;
    }

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

      // Log aktivitas hanya jika berhasil
      useLogStore.getState().addLog({
        user: { id: currentUser.id, nama: currentUser.nama, role: currentUser.roles[0] || 'User' },
        modul: 'penggajian',
        aksi: 'Tambah Kasbon',
        target: kasbon.karyawanId,
        metadata: { nominal: kasbon.jumlah },
      });
    } catch (err) {
      console.error('[usePayrollStore] addKasbon error:', err);
      set((state) => ({ kasbon: state.kasbon.filter((k) => k.id !== kasbon.id) }));
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
