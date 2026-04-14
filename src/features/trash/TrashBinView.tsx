"use client";

import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import { useTrashStore, TrashItem } from '@/stores/useTrashStore';
import { usePOStore } from '@/stores/usePOStore';
import { useToast } from '@/components/molecules/Toast';
import { RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';

export default function TrashBinView() {
  const { trashedItems, restoreItem, purgeItem, clearTrash } = useTrashStore();
  const { addPO } = usePOStore();
  const { success, warning, info } = useToast();

  const handleRestore = (id: string) => {
    const item = restoreItem(id);
    if (!item) return;

    if (item.type === 'po') {
      addPO(item.data);
      success('Data Dipulihkan', `Purchase Order ${item.label} telah dikembalikan ke daftar utama.`);
    }
    // Handle other types here
  };

  const handlePurge = (id: string, label: string) => {
    if (confirm(`Hapus permanen ${label}? Data ini tidak akan bisa dikembalikan lagi.`)) {
      purgeItem(id);
      warning('Data Dimusnahkan', `${label} telah dihapus permanen dari sistem.`);
    }
  };

  const handleClearAll = () => {
    if (confirm('Kosongkan seluruh tempat sampah? Semua data di sini akan hilang selamanya.')) {
      clearTrash();
      info('Tempat Sampah Kosong', 'Seluruh data sampah telah dimusnahkan.');
    }
  };

  const actionHeader = (
    <Button 
      variant="danger" 
      size="sm" 
      icon={<Trash2 size={16} />} 
      onClick={handleClearAll}
      disabled={trashedItems.length === 0}
    >
      Kosongkan Sampah
    </Button>
  );

  return (
    <PageWrapper 
      title="Tempat Sampah (Trash Bin)" 
      subtitle="Data yang dihapus tersimpan di sini sebelum dimusnahkan permanen"
      action={actionHeader}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {trashedItems.length === 0 ? (
          <Panel title="Status">
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Trash2 size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p>Tempat sampah kosong. Tidak ada data yang perlu dipulihkan.</p>
            </div>
          </Panel>
        ) : (
          <Panel title="Daftar Data Terhapus">
            <DataTable
              keyField="id"
              data={trashedItems}
              columns={[
                { key: 'trashedAt', header: 'Waktu Hapus', render: (v: string) => new Date(v).toLocaleString('id-ID') },
                { key: 'type', header: 'Jenis', render: (v: string) => v.toUpperCase() },
                { key: 'label', header: 'Nama Data', render: (v: string) => <strong>{v}</strong> },
                { key: 'trashedBy', header: 'Dihapus Oleh' },
                { key: 'action', header: '', align: 'right', render: (_: any, row: TrashItem) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={<RefreshCcw size={14} />} 
                      onClick={() => handleRestore(row.id)}
                    >
                      Pulihkan
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={<AlertTriangle size={14} />} 
                      style={{ color: '#ef4444' }}
                      onClick={() => handlePurge(row.id, row.label)}
                    >
                      Musnahkan
                    </Button>
                  </div>
                )}
              ]}
            />
          </Panel>
        )}
      </div>
    </PageWrapper>
  );
}
