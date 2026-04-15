import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { usePengirimanStore } from '@/stores/usePengirimanStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Bundle, SuratJalanItem } from '@/types';
import ScanBarcodeSJ from './ScanBarcodeSJ';
import FormSuratJalan from './FormSuratJalan';
import styles from './BuatSuratJalanView.module.css';

interface LocalSJItem {
  bundle: Bundle;
  qtySJ: number;
  alasan?: string;
}

export default function BuatSuratJalanView() {
  const router = useRouter();
  const { klien } = useMasterStore();
  const { getPOById } = usePOStore();
  const { createSuratJalanAtomic } = usePengirimanStore();
  const { currentUser } = useAuthStore();

  const [selectedKlien, setSelectedKlien] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [catatan, setCatatan] = useState('');
  const [localItems, setLocalItems] = useState<LocalSJItem[]>([]);

  const handleBundleFound = (bundle: Bundle, qtySJ: number, alasan?: string) => {
    // Cross-check PO client
    const po = getPOById(bundle.po);
    if (!po || po.klienId !== selectedKlien) {
      alert('Bundel ini bukan milik klien yang dipilih');
      return;
    }
    setLocalItems(prev => [...prev, { bundle, qtySJ, alasan }]);
  };

  const handleRemove = (barcode: string) => {
    setLocalItems(prev => prev.filter(item => item.bundle.barcode !== barcode));
  };

  const handleSubmit = async () => {
    if (!selectedKlien || localItems.length === 0) return;

    if (!confirm(`Buat Surat Jalan untuk ${localItems.length} bundel?`)) return;

    const sjId = `SJ-${Date.now()}`;

    const sjItems: SuratJalanItem[] = localItems.map(it => ({
      id: `${sjId}-${it.bundle.barcode}`,
      bundleBarcode: it.bundle.barcode,
      poId: it.bundle.po,
      modelId: it.bundle.model,
      warnaId: it.bundle.warna,
      sizeId: it.bundle.size,
      skuKlien: it.bundle.skuKlien,
      qty: it.qtySJ,
      qtyPacking: it.bundle.statusTahap.packing.qtySelesai || 0,
      alasanSelisih: it.alasan
    }));

    const bundleBarcodes = localItems.map(it => it.bundle.barcode);

    try {
      await createSuratJalanAtomic({
        id: sjId,
        klienId: selectedKlien,
        tanggal: new Date().toISOString(),
        items: sjItems,
        totalQty: localItems.reduce((sum, i) => sum + i.qtySJ, 0),
        totalBundle: localItems.length,
        catatan,
        status: 'dikirim',
        dibuatOleh: currentUser?.nama ?? 'Admin',
        pengirim
      }, bundleBarcodes);

      router.push('/pengiriman/riwayat');
    } catch (err) {
      alert('Gagal membuat Surat Jalan. Periksa koneksi dan coba lagi.');
      console.error('[BuatSuratJalanView] handleSubmit error:', err);
    }
  };

  return (
    <PageWrapper 
      title="Buat Surat Jalan" 
      subtitle="Kirim barang jadi yang sudah selesai packing ke klien"
    >
      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <Panel title="Informasi Pengiriman">
            <div className={styles.setupForm}>
              <div className={styles.field}>
                <Label>Klien Pemilik Barang <span className={styles.req}>*</span></Label>
                <select 
                  className={styles.select} 
                  value={selectedKlien} 
                  onChange={(e) => {
                    if (localItems.length > 0 && !confirm('Mengganti klien akan menghapus daftar bundle. Lanjut?')) return;
                    setSelectedKlien(e.target.value);
                    setLocalItems([]);
                  }}
                >
                  <option value="">-- Pilih Klien --</option>
                  {klien.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <Label>Nama Pengirim / Driver</Label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={pengirim} 
                  onChange={(e) => setPengirim(e.target.value)} 
                  placeholder="Misal: Pak Jono"
                />
              </div>

              <div className={styles.field}>
                <Label>Catatan Pengiriman</Label>
                <textarea 
                  className={styles.textarea} 
                  value={catatan} 
                  onChange={(e) => setCatatan(e.target.value)} 
                  placeholder="Instruksi khusus pengiriman..."
                />
              </div>
            </div>
          </Panel>

          <ScanBarcodeSJ 
            klienId={selectedKlien} 
            onBundleFound={handleBundleFound}
            addedBarcodes={localItems.map(i => i.bundle.barcode)}
          />
        </div>

        <div className={styles.rightCol}>
          <Panel title={`Daftar Bundle (${localItems.length})`}>
            {localItems.length === 0 ? (
              <div className={styles.empty}>
                <p>Belum ada bundle yang di-scan.</p>
                <p className={styles.hint}>Pilih klien dan scan barcode bundle untuk memulai.</p>
              </div>
            ) : (
              <FormSuratJalan items={localItems} onRemove={handleRemove} />
            )}

            <div className={styles.actions}>
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                disabled={localItems.length === 0}
                onClick={handleSubmit}
              >
                🚚 Konfirmasi & Buat Surat Jalan
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </PageWrapper>
  );
}
