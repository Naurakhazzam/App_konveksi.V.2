'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMasterStore } from '@/stores/useMasterStore';
import DashboardLayout from '../../components/templates/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, canAccess, loadUsers } = useAuthStore();
  const { initializeMasterData } = useMasterStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check Login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    } 

    // 2. Initial Data Fetch from Supabase
    initializeMasterData();
    loadUsers();

    // 3. Check Permission (URL Guard)
    if (!canAccess(pathname) && pathname !== '/dashboard/produksi') {
      router.replace('/dashboard/produksi');
      return;
    }

    setIsReady(true);
  }, [isAuthenticated, router, pathname]);

  if (!isReady) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
