'use client';

/**
 * useRealtimeSync
 * ──────────────────────────────────────────────────────────────────────────
 * Subscribe ke Supabase Realtime untuk tabel-tabel kritis.
 * Setiap perubahan (INSERT / UPDATE / DELETE) akan men-trigger reload
 * store yang relevan secara debounced supaya tidak hammer DB.
 *
 * Dipanggil sekali dari (dashboard)/layout.tsx setelah user login.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePOStore } from '@/stores/usePOStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useLogStore } from '@/stores/useLogStore';
import { useTrashStore } from '@/stores/useTrashStore';
import { usePengirimanStore } from '@/stores/usePengirimanStore';
import { useReturnStore } from '@/stores/useReturnStore';
import { useSerahTerimaStore } from '@/stores/useSerahTerimaStore';
import { useMasterStore } from '@/stores/useMasterStore';

// ── Debounce helper ───────────────────────────────────────────────────────────

function useDebounced(fn: () => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, delay);
  }, [fn, delay]);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRealtimeSync() {
  const initializeMasterData = useMasterStore((s) => s.initializeMasterData);
  const loadPOs        = usePOStore((s) => s.loadPOs);
  const loadBundles    = useBundleStore((s) => s.loadBundles);
  const loadKoreksi    = useKoreksiStore((s) => s.loadKoreksi);
  const loadPayroll    = usePayrollStore((s) => s.loadPayroll);
  const loadInventory  = useInventoryStore((s) => s.loadInventory);
  const loadLogs       = useLogStore((s) => s.loadLogs);
  const loadTrash      = useTrashStore((s) => s.loadTrash);
  const loadPengiriman = usePengirimanStore((s) => s.loadPengiriman);
  const loadReturns    = useReturnStore((s) => s.loadReturns);
  const loadSerahTerima = useSerahTerimaStore((s) => s.loadSerahTerima);

  // Debounced reload — tiap tabel tunggu 800 ms setelah event terakhir
  const reloadPO          = useDebounced(loadPOs, 800);
  const reloadBundle      = useDebounced(loadBundles, 800);
  const reloadKoreksi     = useDebounced(loadKoreksi, 800);
  const reloadPayroll     = useDebounced(loadPayroll, 800);
  const reloadInventory   = useDebounced(loadInventory, 1200);
  const reloadLogs        = useDebounced(loadLogs, 1500);
  const reloadTrash       = useDebounced(loadTrash, 1200);
  const reloadPengiriman  = useDebounced(loadPengiriman, 800);
  const reloadReturns     = useDebounced(loadReturns, 800);
  const reloadSerahTerima = useDebounced(loadSerahTerima, 800);
  // Master data jarang berubah — debounce lebih panjang (3 detik)
  const reloadMaster      = useDebounced(initializeMasterData, 3000);

  useEffect(() => {
    // ── Channel: Produksi (PO + Bundle) ──────────────────────────────────────
    const produksiChannel = supabase
      .channel('realtime-produksi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_order' }, reloadPO)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'po_item' }, reloadPO)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bundle' }, reloadBundle)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bundle_status_tahap' }, reloadBundle)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ produksi channel connected');
        }
      });

    // ── Channel: Koreksi & Approval ───────────────────────────────────────────
    const koreksiChannel = supabase
      .channel('realtime-koreksi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'koreksi' }, reloadKoreksi)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_approval' }, reloadKoreksi)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ koreksi channel connected');
        }
      });

    // ── Channel: Penggajian ───────────────────────────────────────────────────
    const payrollChannel = supabase
      .channel('realtime-payroll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gaji_ledger' }, reloadPayroll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kasbon' }, reloadPayroll)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ payroll channel connected');
        }
      });

    // ── Channel: Inventory ────────────────────────────────────────────────────
    const inventoryChannel = supabase
      .channel('realtime-inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_item' }, reloadInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_batch' }, reloadInventory)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ inventory channel connected');
        }
      });

    // ── Channel: Pengiriman & Return ──────────────────────────────────────────
    const operasionalChannel = supabase
      .channel('realtime-operasional')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surat_jalan' }, reloadPengiriman)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surat_jalan_items' }, reloadPengiriman)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'return_items' }, reloadReturns)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'serah_terima_jahit' }, reloadSerahTerima)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'serah_terima_items' }, reloadSerahTerima)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ operasional channel connected');
        }
      });

    // ── Channel: Master Data ──────────────────────────────────────────────────
    // Debounce 3 detik — data master jarang berubah, tapi harus sync antar device
    const masterChannel = supabase
      .channel('realtime-master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karyawan' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'klien' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'model' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warna' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'size' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'satuan' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kategori' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produk' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produk_hpp_item' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hpp_komponen' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jenis_reject' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alasan_reject' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jabatan' }, reloadMaster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kategori_trx' }, reloadMaster)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ master channel connected');
        }
      });

    // ── Channel: Audit Log & Trash ────────────────────────────────────────────
    const systemChannel = supabase
      .channel('realtime-system')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, reloadLogs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trash_bin' }, reloadTrash)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ system channel connected');
        }
      });

    // ── Cleanup saat unmount / logout ─────────────────────────────────────────
    return () => {
      supabase.removeChannel(produksiChannel);
      supabase.removeChannel(koreksiChannel);
      supabase.removeChannel(payrollChannel);
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(operasionalChannel);
      supabase.removeChannel(masterChannel);
      supabase.removeChannel(systemChannel);
      console.log('[Realtime] 🔌 All channels disconnected');
    };
  }, [
    reloadPO, reloadBundle, reloadKoreksi,
    reloadPayroll, reloadInventory, reloadLogs, reloadTrash,
    reloadPengiriman, reloadReturns, reloadSerahTerima, reloadMaster,
  ]);
}
