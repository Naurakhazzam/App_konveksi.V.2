import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KategoriSection from './KategoriSection';
import ModelSection from './ModelSection';
import SizeSection from './SizeSection';
import WarnaSection from './WarnaSection';
import styles from './MasterDetailView.module.css';

export default function MasterDetailView() {
  const [activeTab, setActiveTab] = useState<'kategori' | 'model' | 'size' | 'warna'>('kategori');

  return (
    <PageWrapper 
      title="Master Detail" 
      subtitle="Kelola data kategori, model, ukuran, dan warna spesifikasi produk"
    >
      <Panel title="Daftar Master Data" sequenceIndex={0}>
        <div className={styles.container}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'kategori' ? styles.active : ''}`}
              onClick={() => setActiveTab('kategori')}
            >
              Kategori
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'model' ? styles.active : ''}`}
              onClick={() => setActiveTab('model')}
            >
              Model
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'size' ? styles.active : ''}`}
              onClick={() => setActiveTab('size')}
            >
              Size
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'warna' ? styles.active : ''}`}
              onClick={() => setActiveTab('warna')}
            >
              Warna
            </button>
          </div>
          
          <div className={styles.content}>
            {activeTab === 'kategori' && <KategoriSection />}
            {activeTab === 'model' && <ModelSection />}
            {activeTab === 'size' && <SizeSection />}
            {activeTab === 'warna' && <WarnaSection />}
          </div>
        </div>
      </Panel>
    </PageWrapper>
  );
}
