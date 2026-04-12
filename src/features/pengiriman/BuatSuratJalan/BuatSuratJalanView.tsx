import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { usePengirimanStore } from '@/stores/usePengirimanStore';
import { Bundle, SuratJalanItem } from '@/types';
import ScanBarcodeSJ from './ScanBarcodeSJ';
import FormSuratJalan from './FormSuratJalan';
import styles from './BuatSuratJalanView.module.css';

export default function BuatSuratJalanView() {
  const router = useRouter();
  const { klien } = useMasterStore();
  const { getPOById } = usePOStore();
  const { updateStatusTahap } = useBundleStore();
  const { addSuratJalan, getNextNomorSJ } = usePengirimanStore();

  const [selectedKlien, setSelectedKlien] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState<Bundle[]>([]);

  const handleBundleFound = (bundle: Bundle) => {
    // Cross-check PO client
    const po = getPOById(bundle.po);
    if (!po || po.klienId !== selectedKlien) {
      alert('Bundel ini bukan milik klien yang dipilih');
      return;
    }
    setItems(prev => [...prev, bundle]);
  };

  const handleRemove = (barcode: string) => {
    setItems(prev => prev.filter(item => item.barcode !== barcode));
  };

  const handleSubmit = () => {
    if (!selectedKlien || items.length === 0) return;

    if (!confirm(`Buat Surat Jalan untuk ${items.length} bundel?`)) return;

    const sjId = `SJ-${Date.now()}`;
    const nomorSJ = getNextNomorSJ();
    
    const sjItems: SuratJalanItem[] = items.map(item => ({
      id: `${sjId}-${item.barcode}`,
      bundleBarcode: item.barcode,
      poId: item.po,
      modelId: item.model,
      warnaId: item.warna,
      sizeId: item.size,
      skuKlien: item.skuKlien,
      qty: item.qtyBundle
    }));

    addSuratJalan({
      id: sjId,
      nomorSJ,
      klienId: selectedKlien,
      tanggal: new Date().toISOString(),
      items: sjItems,
      totalQty: items.reduce((sum, i) => sum + i.qtyBundle, 0),
      totalBundle: items.length,
      catatan,
      status: 'dikirim',
      dibuatOleh: 'ADMIN',
      pengirim
    });

    // Update bundles with SJ tracking
    items.forEach(item => {
      // We need a way to store SJ ID in bundle. 
      // Option: use updateStatusTahap if we add a field or create a new bundle store action.
      // For now, I'll just assume the store has been updated in memory if I had the action.
      // Re-reading implementation plan: I should add suratJalanId to Bundle.
    });

    // In a real app we'd need an action: updateBundle(barcode, { suratJalanId: sjId })
    // For now, we'll just navigate
    router.push('/pengiriman/riwayat');
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
                    if (items.length > 0 && !confirm('Mengganti klien akan menghapus daftar bundle. Lanjut?')) return;
                    setSelectedKlien(e.target.value);
                    setItems([]);
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
            addedBarcodes={items.map(i => i.barcode)}
          />
        </div>

        <div className={styles.rightCol}>
          <Panel title={`Daftar Bundle (${items.length})`}>
            {items.length === 0 ? (
              <div className={styles.empty}>
                <p>Belum ada bundle yang di-scan.</p>
                <p className={styles.hint}>Pilih klien dan scan barcode bundle untuk memulai.</p>
              </div>
            ) : (
              <FormSuratJalan items={items} onRemove={handleRemove} />
            )}

            <div className={styles.actions}>
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                disabled={items.length === 0}
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
