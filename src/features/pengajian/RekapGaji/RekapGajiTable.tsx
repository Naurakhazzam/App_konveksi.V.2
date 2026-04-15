import React from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './RekapGajiTable.module.css';

interface RekapKaryawan {
  id: string;
  nama: string;
  upahKotor: number;
  potongan: number;
  rework: number;
  upahBersih: number; // borongan bersih
  totalEscrow: number;
  sisaKasbon: number;
  entryIds: string[];
  isLunas: boolean;
  gajiPokok: number; 
}

interface RekapGajiTableProps {
  data: RekapKaryawan[];
  onBayar: (rekap: RekapKaryawan) => void;
  onViewSlip: (karyawanId: string) => void;
}

export default function RekapGajiTable({ data, onBayar, onViewSlip }: RekapGajiTableProps) {
  const columns: Column<RekapKaryawan>[] = [
    { key: 'nama', header: 'Nama Karyawan', render: (v) => <strong>{v}</strong> },
    { 
      key: 'upahKotor', 
      header: 'Upah Kotor', 
      render: (v) => <span className={styles.money}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'potongan', 
      header: 'Potongan (Reject)', 
      render: (v) => <span className={styles.deduction}>{v !== 0 ? `-${formatRupiah(v)}` : '—'}</span> 
    },
    { 
      key: 'rework', 
      header: 'Rework', 
      render: (v) => <span className={styles.bonus}>{v !== 0 ? `+${formatRupiah(v)}` : '—'}</span> 
    },
    { 
      key: 'upahBersih', 
      header: 'Upah Borongan', 
      render: (v) => <span className={styles.total}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'totalEscrow', 
      header: 'Escrow (Hold)', 
      render: (v) => <span className={v > 0 ? styles.warning : ''}>{v > 0 ? formatRupiah(v) : '—'}</span> 
    },
    { 
      key: 'sisaKasbon', 
      header: 'Sisa Kasbon', 
      render: (v) => <span className={v > 0 ? styles.kasbon : ''}>{v > 0 ? formatRupiah(v) : '—'}</span> 
    },
    { 
      key: 'isLunas', 
      header: 'Status', 
      render: (v) => (
        <Badge variant={v ? 'success' : 'warning'}>
          {v ? 'LUNAS' : 'BELUM DIBAYAR'}
        </Badge>
      ) 
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (_, row) => (
        <div className={styles.actions}>
          {!row.isLunas && (row.upahBersih + row.gajiPokok) > 0 && (
            <Button variant="primary" size="sm" onClick={() => onBayar(row)}>
              💸 Bayar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onViewSlip(row.id)}>
            📄 Slip
          </Button>
        </div>
      )
    }
  ];

  return <DataTable columns={columns} data={data} keyField="id" />;
}
