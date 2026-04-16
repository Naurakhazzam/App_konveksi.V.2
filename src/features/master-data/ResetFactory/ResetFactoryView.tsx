'use client';

import React, { useState } from 'react';
import { useMasterStore } from '@/stores/useMasterStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  ShieldAlert, 
  RefreshCcw, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/molecules/Toast';

export default function ResetFactoryView() {
  const { resetFactory, isLoading } = useMasterStore();
  const { ownerPin } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'initial' | 'pin' | 'confirm' | 'success'>('initial');

  const handleStart = () => setStep('pin');
  
  const handleVerifyPin = () => {
    if (pin === ownerPin) {
      setStep('confirm');
    } else {
      toastError('PIN Salah!', 'Hanya owner yang dapat melakukan reset.');
      setPin('');
    }
  };

  const handleReset = async () => {
    try {
      await resetFactory();
      setStep('success');
      toastSuccess('Berhasil', 'Sistem telah di-reset ke pengaturan pabrik.');
    } catch (err) {
      toastError('Gagal', 'Gagal melakukan reset. Silakan hubungi developer.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Reset Factory</h1>
              <p className="text-red-100/80">Kembalikan sistem ke kondisi awal (Data Master Tetap Aman)</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {step === 'initial' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    Data yang akan dihapus:
                  </h3>
                  <ul className="space-y-3 text-slate-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                      <span>Semua Purchase Order (PO) & Detail Item</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                      <span>Semua Bundle & Status Produksi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                      <span>Semua Transaksi Keuangan & Jurnal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                      <span>Semua Data Gaji & Kasbon</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                      <span>Semua Stok Gudang & Transaksi Kain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                      <span>Semua Log Aktivitas & Tempat Sampah</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Data yang TETAP AMAN:
                  </h3>
                  <ul className="space-y-3 text-emerald-700/80">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />
                      <span>Daftar Karyawan & Jabatan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />
                      <span>Daftar Klien / Pelanggan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />
                      <span>Daftar Model, Kategori, Warna, & Size</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />
                      <span>Daftar Produk & Setting HPP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />
                      <span>Struktur Pengguna & Role</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <p className="text-amber-800 text-sm font-medium">
                    PERINGATAN: Tindakan ini tidak dapat dibatalkan. Pastikan Anda telah melakukan backup data jika diperlukan.
                  </p>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                Mulai Proses Reset
                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          )}

          {step === 'pin' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-8 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Verifikasi Owner</h2>
                <p className="text-slate-500 mt-2">Masukkan PIN Owner untuk melanjutkan tindakan berbahaya ini.</p>
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-48 text-center text-4xl tracking-[1em] py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-red-500 transition-colors bg-white font-mono"
                maxLength={4}
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('initial')}
                  className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerifyPin}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-100"
                >
                  Verifikasi
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-8 animate-in pulse duration-1000">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Konfirmasi Terakhir</h2>
                <p className="text-slate-500 mt-2">
                  Apakah Anda BENAR-BENAR yakin ingin menghapus seluruh data transaksi?
                  <br />
                  <span className="font-bold text-red-600">SEMUA PO AKAN HILANG TOTAL.</span>
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-xl text-lg hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <RefreshCcw className="w-6 h-6 animate-spin" />
                      Sedang Melakukan Reset...
                    </>
                  ) : (
                    'IYA, HAPUS SEMUA DATA SEKARANG'
                  )}
                </button>
                <button
                  onClick={() => setStep('initial')}
                  disabled={isLoading}
                  className="w-full py-4 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                >
                  Tidak, Kembali Saja
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Selesai!</h2>
                <p className="text-slate-500 mt-4 text-lg">
                  Sistem telah bersih dari data uji coba. Anda dapat mulai menginput data produksi baru dari nol sekarang.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
              >
                Ke Dashboard Utama
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info tambahan di luar kartu */}
      <div className="mt-8 text-center text-slate-400 text-sm">
        <p>© 2026 Stitchlyx Syncore V2 • Fitur ini hanya tersedia untuk akun Owner</p>
      </div>
    </div>
  );
}
