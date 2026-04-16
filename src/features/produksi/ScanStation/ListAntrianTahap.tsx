import React, { useMemo } from 'react';
import { Bundle } from '@/types';
import { useBundleStore } from '@/stores/useBundleStore';
import { usePOStore } from '@/stores/usePOStore';
import { useMasterStore } from '@/stores/useMasterStore';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { TahapKey, TAHAP_ORDER, TAHAP_LABEL, getBundleIssueSummary, getExpectedQTY } from '@/lib/utils/production-helpers';
import Panel from '@/components/molecules/Panel';
import styles from './ListAntrianTahap.module.css';

interface ListAntrianTahapProps {
  tahap: TahapKey;
}

export default function ListAntrianTahap({ tahap }: ListAntrianTahapProps) {
  const { bundles } = useBundleStore();
  const { poList } = usePOStore();
  const { model, warna, sizes } = useMasterStore();

  const nextStageIdx = TAHAP_ORDER.indexOf(tahap) + 1;
  const nextStage = nextStageIdx < TAHAP_ORDER.length ? TAHAP_ORDER[nextStageIdx] : null;

  const prevStageIdx = TAHAP_ORDER.indexOf(tahap) - 1;
  const prevStage = prevStageIdx >= 0 ? TAHAP_ORDER[prevStageIdx] : null;

  const { koreksiList } = useKoreksiStore(); // Get corrections for real qty calculation

  const data = useMemo(() => {
    const list: (Bundle & { viewStatus: string, viewStatusType: string, expectedQty: number })[] = [];

    bundles.forEach(b => {
      const currentST = b.statusTahap[tahap];
      // W-05: Hitung expected qty sekali saja di sini (memoized)
      const expectedQty = getExpectedQTY(b, tahap, koreksiList);

      // 1. ANTRIAN MASUK (Sudah selesai di tahap sebelumnya, tapi belum di-terima di tahap ini)
      if (prevStage && b.statusTahap[prevStage].status === 'selesai' && currentST.status === null) {
        list.push({ ...b, viewStatus: `Menunggu Antrian ${TAHAP_LABEL[tahap]}`, viewStatusType: 'warning', expectedQty });
        return;
      }

      // 2. PROSES (Sedang dikerjakan di tahap ini)
      let isProses = false;
      if (tahap === 'cutting') {
        const po = poList.find(p => p.id === b.po);
        const item = po?.items.find(i => i.modelId === b.model && i.warnaId === b.warna && i.sizeId === b.size);
        if (item?.statusCutting === 'started' && currentST.status === null) {
          isProses = true;
        }
      } else {
        if (currentST.status === 'terima') {
          isProses = true;
        }
      }

      if (isProses) {
        list.push({ ...b, viewStatus: `Sedang Proses ${TAHAP_LABEL[tahap]}`, viewStatusType: 'info', expectedQty });
        return;
      }

      // 3. SELESAI PENDING (Sudah selesai di tahap ini tapi belum di-terima tahap selanjutnya)
      let isSelesaiPending = false;
      if (currentST.status === 'selesai') {
        if (tahap === 'packing') {
          if (!b.suratJalanId) isSelesaiPending = true;
        } else if (nextStage) {
          if (b.statusTahap[nextStage].status === null) isSelesaiPending = true;
        }
      }

      if (isSelesaiPending) {
        let label = '';
        if (tahap === 'packing') label = 'Menunggu Pengiriman';
        else label = `Selesai ${TAHAP_LABEL[tahap]} (Menunggu ${TAHAP_LABEL[nextStage!]})`;
        list.push({ ...b, viewStatus: label, viewStatusType: 'success', expectedQty });
      }
    });

    return list;
  }, [bundles, poList, tahap, nextStage, prevStage, koreksiList]);


  const columns: Column<any>[] = [
    { key: 'po', header: 'Nomor PO', render: (val) => <strong>{val}</strong> },
    { 
      key: 'artikel', 
      header: 'Artikel & Size', 
      render: (_, row) => {
        const m = model.find(xm => xm.id === row.model)?.nama || row.model;
        const w = warna.find(xw => xw.id === row.warna)?.nama || row.warna;
        const s = (sizes as any[]).find(xs => xs.id === row.size)?.nama || row.size;
        return `${m} - ${w} - ${s}`;
      } 
    },
    { 
      key: 'barcode', 
      header: 'KODE UNIK', 
      render: (val) => <code style={{ fontSize: '11px' }}>{val}</code> 
    },
    { 
      key: 'qtyBundle', 
      header: 'Isi (pcs)', 
      align: 'center',
      render: (_, row) => {
        const expected = row.expectedQty;
        const isShort = expected < row.qtyBundle;
        return (
          <div style={{ color: isShort ? '#ef4444' : 'inherit', fontWeight: isShort ? 'bold' : 'normal' }}>
            {expected} {isShort && <small style={{ opacity: 0.7 }}> (Asli: {row.qtyBundle})</small>}
          </div>
        );
      }
    },
    {
      key: 'koreksi',
      header: 'Keterangan',
      render: (_, row) => {
        const summary = getBundleIssueSummary(row.barcode, koreksiList);
        return summary ? <span style={{ color: '#f59e0b', fontSize: '11px' }}>⚠️ {summary}</span> : <span style={{ opacity: 0.4 }}>-</span>;
      }
    },
    { 
      key: 'viewStatus', 
      header: 'Status', 
      render: (val, row) => <Badge variant={row.viewStatusType as any}>{val}</Badge> 
    }
  ];

  return (
    <Panel title={`List Proses & Antrian (${TAHAP_LABEL[tahap]})`} className={styles.wrapper}>
      <DataTable 
        columns={columns} 
        data={data} 
        keyField="barcode" 
        emptyMessage="Tidak ada antrian."
      />
    </Panel>
  );
}
