import React from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import ProgressBar from '@/components/atoms/ProgressBar';
import Badge from '@/components/atoms/Badge';
import { PurchaseOrder, Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import { TAHAP_ORDER, TahapKey, getProgressByPO, TAHAP_LABEL } from '@/lib/utils/production-helpers';

interface MonitoringPerPOProps {
  poList: PurchaseOrder[];
  bundles: Bundle[];
}

export default function MonitoringPerPO({ poList, bundles }: MonitoringPerPOProps) {
  const { klien } = useMasterStore();

  const getProgressColor = (pct: number): 'cyan' | 'green' | 'yellow' | 'red' => {
    if (pct >= 100) return 'green';
    if (pct >= 50) return 'cyan';
    if (pct > 0) return 'yellow';
    return 'cyan'; // default gray style doesn't exist, using cyan with low value or custom class if needed
  };

  const columns: Column<PurchaseOrder>[] = [
    { 
      key: 'nomorPO', 
      header: 'No. PO', 
      render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{val}</span> 
    },
    { 
      key: 'klienId', 
      header: 'Klien',
      render: (val) => klien.find(k => k.id === val)?.nama || val
    },
    { 
      key: 'totalBundles', 
      header: 'Bundles',
      render: (_, row) => bundles.filter(b => b.po === row.id).length
    },
    ...TAHAP_ORDER.map((t): Column<PurchaseOrder> => ({
      key: t,
      header: TAHAP_LABEL[t],
      render: (_, row) => {
        const stats = getProgressByPO(bundles, row.id, t);
        return (
          <div style={{ minWidth: '80px' }}>
            <ProgressBar 
              value={stats.pct} 
              color={getProgressColor(stats.pct)} 
            />
            <span style={{ fontSize: '10px', display: 'block', textAlign: 'center', marginTop: '4px' }}>
              {stats.done}/{stats.total}
            </span>
          </div>
        );
      }
    })),
    { 
      key: 'status', 
      header: 'Status',
      render: (val) => {
        const variant = val === 'selesai' ? 'success' : val === 'aktif' ? 'info' : 'neutral';
        return <Badge variant={variant}>{val}</Badge>;
      }
    }
  ];

  return (
    <DataTable columns={columns} data={poList} keyField="id" />
  );
}
