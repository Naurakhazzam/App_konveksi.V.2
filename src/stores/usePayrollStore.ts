import { create } from 'zustand';
import { GajiLedgerEntry, KasbonEntry } from '../types';
import { dummyGajiLedger, dummyKasbon } from '../data/dummy-payroll';

interface PayrollState {
  ledger: GajiLedgerEntry[];
  kasbon: KasbonEntry[];
  
  addLedgerEntry: (entry: GajiLedgerEntry) => void;
  calculateUpah: (karyawanId: string, startDate?: string, endDate?: string) => {
    upah: number;
    potongan: number;
    rework: number;
    upahBersih: number;
    kasbonSisa: number;
    entries: GajiLedgerEntry[];
  };
  prosesBayar: (karyawanId: string, entryIds: string[], inputKasbon: number) => void;
  setSlipPrinted: (entryIds: string[]) => void;
  addKasbon: (kasbon: KasbonEntry) => void;
  getSisaKasbon: (karyawanId: string) => number;
}

import { useLogStore } from './useLogStore';
import { useAuthStore } from './useAuthStore';

export const usePayrollStore = create<PayrollState>((set, get) => ({
  ledger: dummyGajiLedger,
  kasbon: dummyKasbon,
  
  addLedgerEntry: (entry) => set((state) => ({ ledger: [...state.ledger, entry] })),
  
  calculateUpah: (karyawanId, startDate, endDate) => {
    let entries = get().ledger.filter(l => l.karyawanId === karyawanId);
    
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      entries = entries.filter(e => {
        const time = new Date(e.tanggal).getTime();
        return time >= start && time <= end;
      });
    }

    let upah = 0;
    let potongan = 0;
    let rework = 0;
    
    entries.forEach(e => {
      if (e.tipe === 'selesai') upah += e.total;
      if (e.tipe === 'reject_potong') potongan += Math.abs(e.total);
      if (e.tipe === 'rework') rework += e.total;
    });

    const kasbonSisa = get().getSisaKasbon(karyawanId);
    
    return {
      upah,
      potongan,
      rework,
      upahBersih: upah - potongan + rework,
      kasbonSisa,
      entries
    };
  },
  
  getSisaKasbon: (karyawanId) => {
    return get().kasbon
      .filter(k => k.karyawanId === karyawanId)
      .reduce((acc, curr) => acc + (curr.status === 'belum_lunas' ? curr.jumlah : 0), 0);
  },

  prosesBayar: (karyawanId, entryIds, inputKasbon) => {
    const tanggalBayar = new Date().toISOString();
    const upahData = get().calculateUpah(karyawanId); // Get totals for logging

    set(state => {
      // 1. Mark ledger entries as lunas
      const newLedger = state.ledger.map(l => 
        entryIds.includes(l.id) ? { ...l, status: 'lunas' as const, tanggalBayar } : l
      );

      // 2. Add deduction to kasbon if any
      let newKasbon = [...state.kasbon];
      if (inputKasbon > 0) {
        newKasbon.push({
          id: `KSB-PYMT-${Date.now()}`,
          karyawanId: karyawanId,
          jumlah: -inputKasbon,
          tanggal: tanggalBayar,
          keterangan: 'Potongan pembayaran gaji',
          status: 'lunas'
        });
      }

      return { ledger: newLedger, kasbon: newKasbon };
    });

    // Log Activity
    const user = useAuthStore.getState().user;
    if (user) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.role },
        modul: 'penggajian',
        aksi: 'Bayar Gaji',
        target: karyawanId,
        metadata: { 
          totalUpah: upahData.upahBersih, 
          potongKasbon: inputKasbon,
          netto: upahData.upahBersih - inputKasbon
        }
      });
    }
  },

  setSlipPrinted: (entryIds) => {
    set(state => ({
      ledger: state.ledger.map(l => 
        entryIds.includes(l.id) ? { ...l, isPrinted: true } : l
      )
    }));
  },
  
  addKasbon: (kasbon) => {
    set((state) => ({ kasbon: [...state.kasbon, kasbon] }));

    // Log Activity
    const user = useAuthStore.getState().user;
    if (user) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.role },
        modul: 'penggajian',
        aksi: 'Tambah Kasbon',
        target: kasbon.karyawanId,
        metadata: { nominal: kasbon.jumlah }
      });
    }
  }
}));
