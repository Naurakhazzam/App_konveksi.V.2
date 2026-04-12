import React, { useState, useMemo } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Pagination from '@/components/molecules/Pagination';
import { useMasterStore } from '@/stores/useMasterStore';
import { Produk } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';
import { useFinanceAccess } from '@/lib/hooks/useFinanceAccess';

export interface TabelProdukProps {
  onSelect: (produkId: string) => void;
  selectedId: string | null;
  filterModelId?: string | null;
}

export default function TabelProduk({ onSelect, selectedId, filterModelId }: TabelProdukProps) {
  const { produk, model, sizes, warna, kategori, getTotalHPP, getMargin, updateProduk } = useMasterStore();
  const { canSeeFinance } = useFinanceAccess();

  // Filter products by model if provided
  const filteredSource = useMemo(() => {
    if (!filterModelId) return produk;
    return produk.filter(p => p.modelId === filterModelId);
  }, [produk, filterModelId]);

  // Settings
  const itemsPerPage = 20;
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleToggleAktif = (e: React.MouseEvent, p: Produk) => {
    e.stopPropagation();
    updateProduk(p.id, { aktif: !p.aktif });
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Logic to get resolved names for sorting
  const getSortValue = (row: Produk, key: string) => {
    switch (key) {
      case 'model': return model.find(m => m.id === row.modelId)?.nama || '';
      case 'kategori': {
        const m = model.find(m => m.id === row.modelId);
        return kategori.find(kat => kat.id === m?.kategoriId)?.nama || '';
      }
      case 'size': return sizes.find(s => s.id === row.sizeId)?.nama || '';
      case 'warna': return warna.find(w => w.id === row.warnaId)?.nama || '';
      case 'hpp': return getTotalHPP(row.id);
      case 'margin': return getMargin(row.id).nominal;
      default: return (row as any)[key] || '';
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredSource;
    
    return [...filteredSource].sort((a, b) => {
      const valA = getSortValue(a, sortKey);
      const valB = getSortValue(b, sortKey);
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      
      return sortDirection === 'asc' 
        ? (valA > valB ? 1 : -1)
        : (valA < valB ? 1 : -1);
    });
  }, [produk, sortKey, sortDirection, model, kategori, sizes, warna]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: Column<Produk>[] = [
    { 
      key: 'no', 
      header: 'No', 
      width: '40px',
      sortable: false,
      render: (_, __, index) => <span style={{ color: 'var(--color-text-sub)', fontSize: '11px' }}>{(currentPage - 1) * itemsPerPage + index + 1}</span> 
    },
    { key: 'skuInternal', header: 'SKU Internal', render: (val) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 600 }}>{val}</span> },
    { key: 'skuKlien', header: 'SKU Klien', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Produk', render: (val) => val || '-' },
    { key: 'model', header: 'Model', render: (_, row) => model.find(m => m.id === row.modelId)?.nama },
    { key: 'kategori', header: 'Kategori', render: (_, row) => {
      const m = model.find(m => m.id === row.modelId);
      const k = kategori.find(kat => kat.id === m?.kategoriId);
      return k?.nama || '-';
    }},
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
    <div>
      <DataTable 
        columns={columns} 
        data={paginatedData} 
        keyField="id" 
        onRowClick={(row) => onSelect(row.id)}
        striped={false}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        compact
      />
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}

