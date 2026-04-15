'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useJurnalStore } from '@/stores/useJurnalStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useLogStore } from '@/stores/useLogStore';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { useTrashStore } from '@/stores/useTrashStore';
import { usePengirimanStore } from '@/stores/usePengirimanStore';
import { useReturnStore } from '@/stores/useReturnStore';
import { useScanStore } from '@/stores/useScanStore';
import { useSerahTerimaStore } from '@/stores/useSerahTerimaStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import DashboardLayout from '../../components/templates/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, canAccess, loadUsers, _hasHydrated } = useAuthStore();
  const { initializeMasterData } = useMasterStore();
  const { loadPOs } = usePOStore();
  const { loadBundles } = useBundleStore();
  const { loadInventory } = useInventoryStore();
  const { loadJurnal } = useJurnalStore();
  const { loadPayroll } = usePayrollStore();
  const { loadLogs } = useLogStore();
  const { loadKoreksi } = useKoreksiStore();
  const { loadTrash } = useTrashStore();
  const { loadPengiriman } = usePengirimanStore();
  const { loadReturns } = useReturnStore();
  const { loadScanHistory } = useScanStore();
  const { loadSerahTerima } = useSerahTerimaStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Realtime sync — aktif setelah app ready
  useRealtimeSync();

  useEffect(() => {
    // Tunggu sampai data localStorage (Persist) selesai dimuat
    if (!_hasHydrated) return;

    // 1. Check Login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // 2. Initial Data Fetch from Supabase (semua paralel)
    initializeMasterData();
    loadUsers();
    loadPOs();
    loadBundles();
    loadInventory();
    loadJurnal();
    loadPayroll();
    loadLogs();
    loadKoreksi();
    loadTrash();
    loadPengiriman();
    loadReturns();
    loadScanHistory();
    loadSerahTerima();

    // 3. Check Permission (URL Guard)
    if (!canAccess(pathname) && pathname !== '/dashboard/produksi') {
      router.replace('/dashboard/produksi');
      return;
    }

    setIsReady(true);
  }, [isAuthenticated, _hasHydrated, pathname]);

  if (!isReady) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
