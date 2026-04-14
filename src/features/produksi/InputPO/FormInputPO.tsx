import React, { useState } from 'react';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import TextInput from '@/components/atoms/Input/TextInput';
import NumberInput from '@/components/atoms/Input/NumberInput';
import { Label, Heading, MonoText } from '@/components/atoms/Typography';
import { usePOStore } from '@/stores/usePOStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { POItem, Bundle, StatusTahap } from '@/types';
import { generateBarcode } from '@/lib/utils/barcode-generator';
import styles from './FormInputPO.module.css';

interface FormInputPOProps {
  onCancel: () => void;
  onSuccess: (poId: string) => void;
}

import { useToast } from '@/components/molecules/Toast';

export default function FormInputPO({ onCancel, onSuccess }: FormInputPOProps) {
  const { toast, success, error } = useToast();
  const { getNextNomorPO, addPO, incrementGlobalSequence } = usePOStore();
  const { klien, model, warna, sizes, produk: allProducts } = useMasterStore();
  const { addBundles } = useBundleStore();

  const [klienId, setKlienId] = useState(klien[0]?.id || '');
  const [tanggalDeadline, setTanggalDeadline] = useState('');
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState<Partial<POItem>[]>([{ id: `temp-${Date.now()}`, qtyPerBundle: 0, qty: 0 }]);

  const nomorPO = getNextNomorPO();

  const handleAddItem = () => {
    setItems([...items, { id: `temp-${Date.now()}`, qtyPerBundle: 0, qty: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Reset dependency fields if parent changes
    if (field === 'modelId') {
      newItems[index].warnaId = undefined;
      newItems[index].sizeId = undefined;
    } else if (field === 'warnaId') {
      newItems[index].sizeId = undefined;
    }

    if (field === 'qty' || field === 'qtyPerBundle') {
      const q = Number(newItems[index].qty || 0);
      const qb = Number(newItems[index].qtyPerBundle || 0);
      newItems[index].jumlahBundle = qb > 0 ? Math.ceil(q / qb) : 0;
    }

    // Auto-fill SKU Klien if Model, Warna, and Size are complete
    const mId = newItems[index].modelId;
    const wId = newItems[index].warnaId;
    const sId = newItems[index].sizeId;

    if (mId && wId && sId) {
      const match = allProducts.find(p => p.modelId === mId && p.warnaId === wId && p.sizeId === sId);
      if (match) {
        newItems[index].skuKlien = match.skuKlien;
      }
    }

    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!klienId) {
      error('Pilih Klien', 'Harap pilih klien terlebih dahulu sebelum menyimpan PO.');
      return;
    }
    
    if (items.some(i => !i.modelId || !i.warnaId || !i.sizeId || !i.qty || !i.qtyPerBundle)) {
      error('Data Tidak Lengkap', 'Harap lengkapi semua baris artikel (termasuk Isi/Bundle) sebelum menyimpan.');
      return;
    }

    const poId = `PO-${Date.now()}`;
    
    const finalItems: POItem[] = items.map((i, idx) => ({
      id: `ITM-${Date.now()}-${idx}`,
      poId,
      modelId: i.modelId!,
      warnaId: i.warnaId!,
      sizeId: i.sizeId!,
      qty: Number(i.qty),
      qtyPerBundle: Number(i.qtyPerBundle),
      jumlahBundle: i.jumlahBundle || Math.ceil(Number(i.qty) / Number(i.qtyPerBundle)),
      skuKlien: i.skuKlien || '',
      skuInternal: `LYX-${Date.now().toString().slice(-4)}${idx}`
    }));

    // Save PO and Bundles ATOMICALLY (Preventative Action)
    const { createPOWithBundles, globalSequence } = usePOStore.getState();
    const po: any = {
      id: poId,
      klienId,
      nomorPO,
      tanggalInput: new Date().toISOString().split('T')[0],
      tanggalDeadline,
      catatan,
      status: 'aktif',
      items: finalItems
    };

    let totalBundlesCount = finalItems.reduce((acc, curr) => acc + curr.jumlahBundle, 0);
    let currentGlobalSeq = globalSequence;

    const newBundles: Bundle[] = [];
    const defaultStatus: StatusTahap = { status: null, qtyTerima: 0, qtySelesai: 0, waktuTerima: null, waktuSelesai: null, karyawan: null, koreksiStatus: null, koreksiAlasan: null };

    finalItems.forEach(item => {
      const modelName = model.find(m => m.id === item.modelId)?.nama || 'MDL';
      const warnaName = warna.find(w => w.id === item.warnaId)?.nama || 'WRN';
      const sizeName = sizes.find((s: any) => s.id === item.sizeId)?.nama || 'SZ';

      let qtyLeft = item.qty;

      for (let i = 1; i <= item.jumlahBundle; i++) {
        const bundleQty = Math.min(qtyLeft, item.qtyPerBundle);
        qtyLeft -= bundleQty;
        
        const barcodeString = generateBarcode({
          nomorPO,
          model: modelName,
          warna: warnaName,
          size: sizeName,
          globalSequence: currentGlobalSeq,
          bundleIndex: i,
          tanggal: new Date()
        });

        newBundles.push({
          barcode: barcodeString,
          po: poId,
          model: item.modelId,
          warna: item.warnaId,
          size: item.sizeId,
          qtyBundle: bundleQty,
          skuKlien: item.skuKlien,
          skuInternal: item.skuInternal,
          statusTahap: {
            cutting: { ...defaultStatus },
            jahit: { ...defaultStatus },
            lkancing: { ...defaultStatus },
            bbenang: { ...defaultStatus },
            qc: { ...defaultStatus },
            steam: { ...defaultStatus },
            packing: { ...defaultStatus },
          }
        });

        currentGlobalSeq++;
      }
    });

    createPOWithBundles(po, newBundles);
    
    success('PO Berhasil Simpan', `Purchase Order ${nomorPO} telah dibuat dengan ${totalBundlesCount} bundle tiket.`);
    onSuccess(poId);
  };

  const totalQty = items.reduce((acc, curr) => acc + Number(curr.qty || 0), 0);
  const totalBundles = items.reduce((acc, curr) => acc + Number(curr.jumlahBundle || 0), 0);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Panel title="Info Utama PO">
        <div className={styles.grid}>
          <div className={styles.field}>
            <Label>Nomor PO / Surat</Label>
            <div className={styles.readonlyBox}><MonoText>{nomorPO}</MonoText></div>
          </div>
          <div className={styles.field}>
            <Label>Klien <span className={styles.req}>*</span></Label>
            <select className={styles.select} value={klienId} onChange={e => setKlienId(e.target.value)} required>
              <option value="">Pilih klien...</option>
              {klien.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <Label>Tenggat Waktu / Deadline (Opsional)</Label>
            <TextInput type="date" value={tanggalDeadline} onChange={setTanggalDeadline} />
          </div>
          <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
            <Label>Catatan Order</Label>
            <TextInput value={catatan} onChange={setCatatan} placeholder="Misal: bordir timbul lapis..." />
          </div>
        </div>
      </Panel>

      <Panel title="Detail Artikel (Item)">
        <div className={styles.itemsContainer}>
          {items.map((item, index) => {
            // Filter available variants from allProducts (linked products)
            const availableWarna = item.modelId 
              ? warna.filter(w => allProducts.some(p => p.modelId === item.modelId && p.warnaId === w.id))
              : [];
            
            const availableSizes = item.modelId && item.warnaId
              ? sizes.filter((s: any) => allProducts.some(p => p.modelId === item.modelId && p.warnaId === item.warnaId && p.sizeId === s.id))
              : [];

            return (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemIndex}>{index + 1}</div>
                <div className={styles.itemGrid}>
                  <div className={styles.field}>
                    <Label>Model <span className={styles.req}>*</span></Label>
                    <select className={styles.select} value={item.modelId || ''} onChange={e => handleItemChange(index, 'modelId', e.target.value)} required>
                      <option value="">-- Model --</option>
                      {model.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <Label>Warna <span className={styles.req}>*</span></Label>
                    <select 
                      className={styles.select} 
                      value={item.warnaId || ''} 
                      onChange={e => handleItemChange(index, 'warnaId', e.target.value)} 
                      required
                      disabled={!item.modelId}
                    >
                      <option value="">-- Warna --</option>
                      {availableWarna.map(w => <option key={w.id} value={w.id}>{w.nama}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <Label>Size <span className={styles.req}>*</span></Label>
                    <select 
                      className={styles.select} 
                      value={item.sizeId || ''} 
                      onChange={e => handleItemChange(index, 'sizeId', e.target.value)} 
                      required
                      disabled={!item.warnaId}
                    >
                      <option value="">-- Size --</option>
                      {availableSizes.map((s: any) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <Label>SKU Klien (Opsional)</Label>
                    <TextInput value={item.skuKlien || ''} onChange={v => handleItemChange(index, 'skuKlien', v)} placeholder="SKU" />
                  </div>
                  <div className={styles.field}>
                    <Label>QTY Order <span className={styles.req}>*</span></Label>
                    <NumberInput value={item.qty || ''} onChange={v => handleItemChange(index, 'qty', v)} />
                  </div>
                  <div className={styles.field}>
                    <Label>Isi/Bundle <span className={styles.req}>*</span></Label>
                    <NumberInput value={item.qtyPerBundle || ''} onChange={v => handleItemChange(index, 'qtyPerBundle', v)} />
                  </div>
                  <div className={styles.field}>
                    <Label>Bundles</Label>
                    <div className={styles.readonlyBoxSmall}>{item.jumlahBundle || 0}</div>
                  </div>
                  {items.length > 1 && (
                    <div className={styles.actionCol}>
                      <Button type="button" variant="ghost" className={styles.delBtn} onClick={() => handleRemoveItem(index)}>✕</Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <Button type="button" variant="ghost" onClick={handleAddItem}>+ Tambah Artikel</Button>
        </div>
      </Panel>

      <div className={styles.footer}>
        <div className={styles.summary}>
          <span>Total QTY: <strong>{totalQty}</strong> pcs</span>
          <span>Total: <strong>{totalBundles}</strong> tiket bundle</span>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
          <Button type="submit" variant="primary">Simpan & Generate Barcode</Button>
        </div>
      </div>
    </form>
  );
}
