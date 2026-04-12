"use client";

import React from 'react';
import DashboardLayout from '../../components/templates/DashboardLayout';
import { BookOpen, Route, AppWindow, Users, Barcode, HelpCircle, Info } from 'lucide-react';
import SectionModules from './sections/SectionModules';
import SectionRoles from './sections/SectionRoles';
import SectionBarcode from './sections/SectionBarcode';
import SectionFAQ from './sections/SectionFAQ';
import styles from './Panduan.module.css';

const FLOW_STEPS = [
  { num: '01', label: 'Input PO', sub: 'Admin input pesanan' },
  { num: '02', label: 'Cutting', sub: 'Potong kain' },
  { num: '03', label: 'Jahit', sub: 'Proses jahit' },
  { num: '04', label: 'L. Kancing', sub: 'Lubang kancing' },
  { num: '05', label: 'Buang Benang', sub: 'Bersihkan sisa' },
  { num: '06', label: 'QC', sub: 'Quality check' },
  { num: '07', label: 'Steam', sub: 'Setrika uap' },
  { num: '08', label: 'Packing', sub: 'Kemas produk' },
  { num: '09', label: 'Kirim', sub: 'Surat jalan' },
];

export default function PanduanPage() {
  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroLabel}>
            <span className={styles.heroBadge}>
              <BookOpen size={12} /> PANDUAN OPERASIONAL
            </span>
          </div>
          <h1 className={styles.heroTitle}>Selamat Datang di Stitchlyx.Syncore</h1>
          <p className={styles.heroDesc}>
            Stitchlyx adalah Garment Operating System — sistem digital terintegrasi yang menggantikan 
            pencatatan Excel manual untuk operasional konveksi. Dari input pesanan, tracking produksi, 
            hingga laporan keuangan dan penggajian — semua tercatat dalam satu platform terpusat.
            Panduan ini akan membantu Anda memahami setiap bagian dari sistem.
          </p>
        </div>

        {/* Alur Produksi */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Route size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Alur Kerja Produksi</h2>
          </div>
          <div className={styles.flowContainer}>
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className={styles.flowStep}>
                  <span className={styles.flowStepNum}>{step.num}</span>
                  <div>
                    <div className={styles.flowStepLabel}>{step.label}</div>
                    <div className={styles.flowStepSub}>{step.sub}</div>
                  </div>
                </div>
                {i < FLOW_STEPS.length - 1 && <span className={styles.flowArrow}>→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.infoBox}>
            <Info size={16} className={styles.infoBoxIcon} />
            <div className={styles.infoBoxContent}>
              <span className={styles.infoBoxTitle}>Logika Sinkron Antar Tahap</span>
              <p className={styles.infoBoxText}>
                Setiap tahap memiliki batas maksimum QTY yang mengacu pada hasil tahap sebelumnya.
                Contoh: Jahit maksimum = hasil Cutting bundle tersebut. QC maksimum = hasil Buang Benang bundle tersebut.
                Jika QTY melebihi batas, diperlukan validasi Owner dan masuk antrian Koreksi Data.
              </p>
            </div>
          </div>
        </div>

        {/* Modul */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <AppWindow size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Modul Aplikasi</h2>
          </div>
          <div className={styles.moduleGrid}>
            <SectionModules />
          </div>
        </div>

        {/* Role */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Users size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Role & Hak Akses</h2>
          </div>
          <SectionRoles />
        </div>

        {/* Barcode */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Barcode size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Format Barcode</h2>
          </div>
          <SectionBarcode />
        </div>

        {/* FAQ */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <HelpCircle size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Pertanyaan Umum (FAQ)</h2>
          </div>
          <SectionFAQ />
        </div>

      </div>
    </DashboardLayout>
  );
}
