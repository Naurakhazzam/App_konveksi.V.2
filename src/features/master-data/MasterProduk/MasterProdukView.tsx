import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import Breadcrumbs from '@/components/molecules/Breadcrumbs';
import FolderCard from '@/components/molecules/FolderCard';
import TabelProduk from './TabelProduk';
import FormProduk from './FormProduk';
import HPPEditorPanel from './HPPEditor/HPPEditorPanel';
import { useMasterStore } from '@/stores/useMasterStore';

import styles from './MasterProdukView.module.css';

export default function MasterProdukView() {
  const { kategori, model, produk } = useMasterStore();
  const [selectedProdukId, setSelectedProdukId] = useState<string | null>(null);
  const [formProdukOpen, setFormProdukOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Explorer State: [] = Root, [catId] = Models, [catId, modId] = Items
  const [viewPath, setViewPath] = useState<string[]>([]);

  const currentLevel = viewPath.length; // 0: Categories, 1: Models, 2: Products
  
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Daftar Master', onClick: () => setViewPath([]) }];
    
    if (currentLevel >= 1) {
      const kat = kategori.find(k => k.id === viewPath[0]);
      items.push({ 
        label: kat?.nama || 'Kategori', 
        onClick: () => setViewPath([viewPath[0]]) 
      });
    }
    
    if (currentLevel >= 2) {
      const mod = model.find(m => m.id === viewPath[1]);
      items.push({ 
        label: mod?.nama || 'Model', 
        onClick: () => setViewPath([viewPath[0], viewPath[1]]) 
      });
    }
    
    return items;
  }, [viewPath, kategori, model]);

  const renderExplorerContent = () => {
    if (currentLevel === 0) {
      // Show Categories
      return (
        <div className={styles.explorerGrid}>
          {kategori.map(kat => (
            <FolderCard 
              key={kat.id}
              name={kat.nama}
              type="category"
              itemCount={model.filter(m => m.kategoriId === kat.id).length}
              onClick={() => setViewPath([kat.id])}
            />
          ))}
        </div>
      );
    }

    if (currentLevel === 1) {
      // Show Models in Category
      const filteredModels = model.filter(m => m.kategoriId === viewPath[0]);
      return (
        <div className={styles.explorerGrid}>
          {filteredModels.map(mod => (
            <FolderCard 
              key={mod.id}
              name={mod.nama}
              type="model"
              itemCount={produk.filter(p => p.modelId === mod.id).length}
              onClick={() => setViewPath([viewPath[0], mod.id])}
            />
          ))}
        </div>
      );
    }

    // Level 2: Show Table for Model
    return (
      <TabelProduk 
        onSelect={(id) => setSelectedProdukId(id)}
        selectedId={selectedProdukId}
        filterModelId={viewPath[1]}
      />
    );
  };

  return (
    <PageWrapper 
      title="Produk & HPP" 
      subtitle="Manajemen master produk dengan Hirarki Folder"
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" onClick={() => setImportOpen(true)}>
            📥 Import CSV
          </Button>
          <Button variant="primary" onClick={() => setFormProdukOpen(true)}>
            + Tambah Produk
          </Button>
        </div>
      }
    >
      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <Panel title={viewPath.length === 2 ? "Daftar Varian Produk" : "Eksplorasi Master Data"}>
            <Breadcrumbs items={breadcrumbItems} />
            <div style={{ minHeight: '400px' }}>
              {renderExplorerContent()}
            </div>
          </Panel>
        </div>
        
        <div className={styles.rightCol}>
          {selectedProdukId ? (
            <HPPEditorPanel produkId={selectedProdukId} />
          ) : (
            <div className={styles.emptyEditor}>
              <p>
                {currentLevel < 2 
                  ? "Buka folder Model untuk memilih produk dan mengedit HPP." 
                  : "Pilih varian dari tabel untuk melihat atau mengedit HPP."}
              </p>
            </div>
          )}
        </div>
      </div>

      <FormProduk 
        open={formProdukOpen} 
        onClose={() => setFormProdukOpen(false)} 
      />

      {importOpen && (
        <React.Suspense fallback={null}>
          {React.createElement(React.lazy(() => import('./ModalImportCSV')), {
            onClose: () => setImportOpen(false)
          })}
        </React.Suspense>
      )}
    </PageWrapper>
  );
}
