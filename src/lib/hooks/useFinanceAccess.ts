import { useAuthStore } from '@/stores/useAuthStore';

export function useFinanceAccess() {
  const currentUser = useAuthStore(state => state.currentUser);
  const canSeeFinance = currentUser?.roles.some(
    r => r === 'owner' || r === 'admin_keuangan' || r === 'godadmin'
  ) ?? false;
  return { canSeeFinance };
}
