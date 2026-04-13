"use client";

import React from 'react';
import DashboardLayout from '../../components/templates/DashboardLayout';
import { BookOpen, Route, ShieldCheck, Truck, Zap, HelpCircle, Info, Sparkles } from 'lucide-react';
import { DocSection, StepItem, DocAlert } from './components/HelpComponents';
import SectionFAQ from './sections/SectionFAQ';
import styles from './Panduan.module.css';

export default function PanduanPage() {
  const [activeTab, setActiveTab] = React.useState('overview');

  const navItems = [
    { id: 'overview', label: 'Ringkasan Sistem', icon: <BookOpen size={18} /> },
    { id: 'produksi', label: 'Alur Produksi', icon: <Route size={18} /> },
    { id: 'koreksi', label: 'Sistem Koreksi QTY', icon: <ShieldCheck size={18} /> },
    { id: 'pengiriman', label: 'Pengiriman & Logistic', icon: <Truck size={18} /> },
    { id: 'pengaturan', label: 'Kustomisasi & UI', icon: <Zap size={18} /> },
    { id: 'faq', label: 'Pertanyaan Umum', icon: <HelpCircle size={18} /> },
  ];

  return (
    <DashboardLayout>
      <div className={styles.page}>
        
        {/* SIDEBAR NAV */}
        <nav className={styles.sidebar}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <div className={styles.contentArea}>
          
          {activeTab === 'overview' && (
            <>
              <div className={styles.hero}>
                <div className={styles.heroLabel}>
                  <span className={styles.heroBadge}>
                    <Info size={12} /> VERSI 2.0 — STABLE
                  </span>
                </div>
                <h1 className={styles.heroTitle}>Selamat Datang di Stitchlyx</h1>
                <p className={styles.heroDesc}>
                  Stitchlyx Syncore adalah ekosistem digital terintegrasi untuk konveksi skala menengah 
                  yang mengedepankan presisi data dan estetika premium. Panduan ini dirancang agar 
                  siapapun dapat memahami alur kerja sistem tanpa perlu pelatihan khusus.
                </p>
              </div>

              <DocSection title="Prinsip Utama Sistem" icon={<Sparkles size={18} />}>
                <StepItem number={1} title="Data Terintegrasi">
                  Input yang Anda lakukan di stasiun Produksi akan otomatis masuk ke laporan Keuangan, Stok Inventory, dan Penggajian Karyawan secara real-time.
                </StepItem>
                <StepItem number={2} title="Validasi Bertahap">
                  Sistem tidak akan membiarkan Anda salah input. Setiap tahap validasi menjaga agar tidak ada barang "siluman" atau upah yang terbayar dobel.
                </StepItem>
                <StepItem number={3} title="Identitas Barcode">
                  Setiap bundel barang memiliki "KTP" digital berupa Barcode unik yang mencatat sejarah produksinya dari awal hingga dikirim ke klien.
                </StepItem>
              </DocSection>
            </>
          )}

          {activeTab === 'produksi' && (
            <DocSection title="Alur Kerja Produksi" icon={<Route size={18} />}>
              <DocAlert type="info" title="Logika Maksimum QTY">
                Setiap tahap produksi hanya bisa menerima QTY maksimal sejumlah yang selesai di tahap sebelumnya. Hal ini mencegah penggelembungan data.
              </DocAlert>
              
              <StepItem number={1} title="Input PO">
                Admin memasukkan data pesanan. Barcode unik akan otomatis tercipta untuk setiap bundel barang.
              </StepItem>
              <StepItem number={2} title="Antrian Cutting">
                Hanya artikel yang sudah di-klik "Mulai Potong" oleh Admin yang bisa discan di stasiun Cutting.
              </StepItem>
              <StepItem number={3} title="Proses Scan Station">
                Operator melakukan scan barcode, memilih nama mereka, dan memasukkan QTY aktual hasil kerjanya.
              </StepItem>

              <DocAlert type="tip" title="Shortcut Scanner">
                Ketik 2 angka pertama nomor bundel untuk pencarian cepat, lalu gunakan panah (↑↓) dan Enter untuk memilih tanpa menyentuh mouse.
              </DocAlert>
            </DocSection>
          )}

          {activeTab === 'koreksi' && (
            <DocSection title="Sistem Koreksi & Reject" icon={<ShieldCheck size={18} />}>
              <p className={styles.stepDesc}>
                Jika hasil kerja kurang dari target, sistem akan memaksa Anda memilih alasan koreksi. Ini krusial untuk akuntabilitas.
              </p>

              <StepItem number={1} title="REJECT (Barang Rusak)">
                Pilih ini jika barang cacat karena kesalahan operator. Gaji operator tahap tersebut akan otomatis dipotong sesuai tarif yang berlaku.
              </StepItem>
              <StepItem number={2} title="HILANG / SALAH HITUNG">
                Pilih ini jika fisik barang tidak ditemukan. Sistem akan membebankan tanggung jawab pada tahap sebelumnya karena dianggap kebobolan saat serah terima.
              </StepItem>
              <StepItem number={3} title="SURPLUS (Barang Lebih)">
                Jika barang lebih, data akan masuk ke antrian 'Koreksi Data'. Admin/Owner harus melakukan 'Approve' sebelum QTY tambahan tersebut diakui sah.
              </StepItem>

              <DocAlert type="warning" title="Potongan Gaji">
                Harap teliti sebelum menyimpan data Reject, karena sistem akan langsung memproses pemotongan pada saldo Gaji karyawan terkait.
              </DocAlert>
            </DocSection>
          )}

          {activeTab === 'pengiriman' && (
            <DocSection title="Logistik & Surat Jalan" icon={<Truck size={18} />}>
              <StepItem number={1} title="Input Nomor Bundel">
                Masukkan nomor bundel yang akan dikirim ke Klien. Satu Surat Jalan bisa berisi lintas PO jika berasal dari Klien yang sama.
              </StepItem>
              <StepItem number={2} title="Validasi QTY Kirim">
                Setelah scan, sebuah modal akan muncul. Anda wajib memasukkan jumlah pcs yang benar-benar dikirim.
              </StepItem>
              
              <DocAlert type="warning" title="Peringatan SHORTAGE">
                Jika Anda memasukkan QTY kurang dari hasil Packing, sebuah **BANNER CAPS LOCK** akan muncul. **Jangan Abaikan!** Segera hubungi tim operasional untuk mengecek fisik barang.
              </DocAlert>

              <StepItem number={3} title="Finalisasi SJ">
                Setelah semua bundel dimasukkan, klik 'Finalisasi' untuk mencetak dokumen dan mengupdate status PO menjadi 'Kirim'.
              </StepItem>
            </DocSection>
          )}

          {activeTab === 'pengaturan' && (
            <DocSection title="Kustomisasi Aplikasi" icon={<Zap size={18} />}>
              <p className={styles.stepDesc}>
                Setiap Admin memiliki kenyamanan mata yang berbeda. Gunakan tab **Pengaturan** untuk mengatur:
              </p>

              <StepItem number={1} title="Dark & Light Mode">
                Gunakan Mode Gelap untuk mengurangi ketegangan mata saat bekerja di ruangan minim cahaya, atau Mode Terang untuk visibilitas maksimal di siang hari.
              </StepItem>
              <StepItem number={2} title="Efek Border Beam">
                Garis bercahaya di sekitar tabel membantu fokus area kerja. Anda bisa mengatur kecepatan putarannya atau mematikannya sepenuhnya jika merasa terganggu.
              </StepItem>
              <StepItem number={3} title="Warna Identitas">
                Ingin suasana baru? Ubah warna gradien aplikasi melalui Color Picker di halaman pengaturan. Perubahan bersifat pribadi dan tidak mengganggu user lain.
              </StepItem>
            </DocSection>
          )}

          {activeTab === 'faq' && (
            <DocSection title="Pertanyaan Umum" icon={<HelpCircle size={18} />}>
              <SectionFAQ />
            </DocSection>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
