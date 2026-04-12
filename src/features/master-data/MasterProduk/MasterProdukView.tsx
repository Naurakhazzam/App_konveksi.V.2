import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import TabelProduk from './TabelProduk';
import FormProduk from './FormProduk';
import HPPEditorPanel from './HPPEditor/HPPEditorPanel';

export default function MasterProdukView() {
  const [selectedProdukId, setSelectedProdukId] = useState<string | null>(null);
  const [formProdukOpen, setFormProdukOpen] = useState(false);

  return (
    <PageWrapper 
      title="Produk & HPP" 
      subtitle="Manajemen master produk dual-SKU dan Harga Pokok Produksi"
      action={
        <Button variant="primary" onClick={() => setFormProdukOpen(true)}>
          + Tambah Produk
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) 2fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ gridColumn: '1 / 2' }}>
          <Panel title="Daftar Master Produk">
            <TabelProduk 
              onSelect={(id) => setSelectedProdukId(id)}
              selectedId={selectedProdukId}
            />
          </Panel>
        </div>
        
        <div style={{ gridColumn: '2 / 3', position: 'sticky', top: '24px', height: 'calc(100vh - 100px)' }}>
          {selectedProdukId ? (
            <HPPEditorPanel produkId={selectedProdukId} />
          ) : (
            <div style={{ 
              background: 'var(--color-bg-secondary)', 
              border: '1px solid var(--color-border)', 
              borderRadius: '12px', 
              padding: '60px 20px', 
              textAlign: 'center', 
              color: 'var(--color-text-sub)' 
            }}>
              <p>Pilih produk dari tabel di samping untuk melihat atau mengedit HPP.</p>
            </div>
          )}
        </div>
      </div>

      <FormProduk 
        open={formProdukOpen} 
        onClose={() => setFormProdukOpen(false)} 
      />
    </PageWrapper>
  );
}
