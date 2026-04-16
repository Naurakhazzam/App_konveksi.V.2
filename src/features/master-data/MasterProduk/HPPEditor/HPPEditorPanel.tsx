import React, { useState } from 'react';
import { useMasterStore } from '@/stores/useMasterStore';
import { useFinanceAccess } from '@/lib/hooks/useFinanceAccess';
import Button from '@/components/atoms/Button';
import HPPSummary from './HPPSummary';
import HPPItemRow from './HPPItemRow';
import AddKomponenModal from './AddKomponenModal';
import CopyHPPModal from './CopyHPPModal';
import BulkUploadModal from './BulkUploadModal';
import styles from './HPPEditorPanel.module.css';

export interface HPPEditorPanelProps {
  produkId: string;
}

export default function HPPEditorPanel({ produkId }: HPPEditorPanelProps) {
  const { produk, hppKomponen, getHPPItemsByProduk, updateProdukHPPItem, removeProdukHPPItem, copyHPPToAllSizes } = useMasterStore();
  const { canSeeFinance } = useFinanceAccess();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const prod = produk.find(p => p.id === produkId);
  if (!prod) return null;

  if (!canSeeFinance) {
    return (
      <div className={styles.noAccessPanel}>
        <h3>Akses Ditolak</h3>
        <p>Anda tidak memiliki izin untuk melihat atau mengubah data Harga Pokok Produksi (HPP). Silakan hubungi Owner atau Administrator Keuangan.</p>
      </div>
    );
  }

  const items = getHPPItemsByProduk(produkId);

  const renderSection = (title: string, kategori: string) => {
    const sectionItems = items.filter(i => {
      const k = hppKomponen.find(k => k.id === i.komponenId);
      return k?.kategori === kategori;
    });

    if (sectionItems.length === 0) return null;

    return (
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <span>{title}</span>
          <span className={styles.line}></span>
        </h4>
        <div className={styles.itemsList}>
          {sectionItems.map(item => {
            const komponen = hppKomponen.find(k => k.id === item.komponenId);
            if (!komponen) return null;
            return (
              <HPPItemRow 
                key={item.id}
                item={item}
                komponen={komponen}
                onUpdate={(data) => updateProdukHPPItem(item.id, data)}
                onRemove={() => removeProdukHPPItem(item.id)}
              />
            );
          })}
        </div>
    );
  };

  const handleCopyAllSizes = () => {
    if (confirm('Terapkan struktur HPP ini ke SELURUH ukuran untuk model yang sama?')) {
      copyHPPToAllSizes(produkId);
      alert('Berhasil diterapkan ke semua ukuran.');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Editor HPP</h3>
          <div className={styles.subtitle}>
            {prod.skuInternal} &bull; {prod.skuKlien}
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => setCopyModalOpen(true)}>Salin dari Produk Lain</Button>
          <Button variant="ghost" size="sm" onClick={handleCopyAllSizes}>Terapkan ke Semua Size</Button>
          <Button variant="secondary" size="sm" onClick={() => setBulkModalOpen(true)}>Upload Massal</Button>
        </div>
      </div>

      <div className={styles.content}>
        <div style={{ marginBottom: '20px' }}>
          <Button variant="primary" onClick={() => setAddModalOpen(true)}>+ Tambah Komponen</Button>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            Belum ada komponen HPP untuk produk ini.
          </div>
        ) : (
          <>
            {renderSection('BAHAN BAKU', 'bahan_baku')}
            {renderSection('BIAYA PRODUKSI', 'biaya_produksi')}
            {renderSection('OVERHEAD', 'overhead')}
            <HPPSummary produkId={produkId} />
          </>
        )}
      </div>

      <AddKomponenModal open={addModalOpen} onClose={() => setAddModalOpen(false)} produkId={produkId} />
      <CopyHPPModal open={copyModalOpen} onClose={() => setCopyModalOpen(false)} targetProdukId={produkId} />
      <BulkUploadModal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />
    </div>
  );
}
