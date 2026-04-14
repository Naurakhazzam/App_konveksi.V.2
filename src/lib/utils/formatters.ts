export const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Returns the current payroll cycle (Saturday to Friday)
 * Standard cycle for STITCHLYX.SYNCORE V2
 */
export const getPayrollCycleRange = () => {
  const now = new Date();
  
  // Find the most recent Saturday (6 = Saturday)
  const start = new Date(now);
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  const diffToSaturday = day === 6 ? 0 : (day + 1);
  start.setDate(now.getDate() - diffToSaturday);
  
  // Friday is 6 days after Saturday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

  return {
    start: toYYYYMMDD(start),
    end: toYYYYMMDD(end)
  };
};
