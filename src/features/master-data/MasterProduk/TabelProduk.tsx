import React from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useMasterStore } from '@/stores/useMasterStore';
import { Produk } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';
import { useFinanceAccess } from '@/lib/hooks/useFinanceAccess';

export interface TabelProdukProps {
  onSelect: (produkId: string) => void;
  selectedId: string | null;
}

export default function TabelProduk({ onSelect, selectedId }: TabelProdukProps) {
  const { produk, model, sizes, warna, getTotalHPP, getMargin, updateProduk } = useMasterStore();
  const { canSeeFinance } = useFinanceAccess();

  const handleToggleAktif = (e: React.MouseEvent, p: Produk) => {
    e.stopPropagation();
    updateProduk(p.id, { aktif: !p.aktif });
  };

  const columns: Column<Produk>[] = [
    { key: 'skuInternal', header: 'SKU Internal', render: (val) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 600 }}>{val}</span> },
    { key: 'skuKlien', header: 'SKU Klien', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'model', header: 'Model', render: (_, row) => model.find(m => m.id === row.modelId)?.nama },
    { key: 'size', header: 'Size', render: (_, row) => sizes.find(s => s.id === row.sizeId)?.nama },
    { key: 'warna', header: 'Warna', render: (_, row) => {
      const w = warna.find(w => w.id === row.warnaId);
      return w ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: w.kodeHex, border: '1px solid var(--color-border)' }} />
          <span>{w.nama}</span>
        </div>
      ) : '-';
    }},
    ...(canSeeFinance ? [
      { key: 'hpp', header: 'Total HPP', align: 'right' as const, render: (_: any, row: Produk) => {
        const total = getTotalHPP(row.id);
        return <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(total)}</span>;
      }},
      { key: 'hargaJual', header: 'Harga Jual', align: 'right' as const, render: (_: any, row: Produk) => {
        return <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(row.hargaJual)}</span>;
      }},
      { key: 'margin', header: 'Margin', align: 'right' as const, render: (_: any, row: Produk) => {
        const margin = getMargin(row.id);
        const color = margin.nominal > 0 ? 'var(--color-success)' : 'var(--color-danger)';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color }}>{formatRupiah(margin.nominal)}</span>
            <span style={{ fontSize: '11px', color }}>{margin.persen.toFixed(1)}%</span>
          </div>
        );
      }}
    ] : []),
    { key: 'status', header: 'Status', render: (_, row) => (
      <span onClick={(e: any) => handleToggleAktif(e, row)} style={{ cursor: 'pointer' }}>
        <Badge variant={row.aktif ? 'success' : 'neutral'}>
          {row.aktif ? 'Aktif' : 'NonAktif'}
        </Badge>
      </span>
    )}
  ];

  return (
    <DataTable 
      columns={columns} 
      data={produk} 
      keyField="id" 
      onRowClick={(row) => onSelect(row.id)}
      striped={false}
    />
  );
}
