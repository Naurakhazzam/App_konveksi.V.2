import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import TextInput from '@/components/atoms/Input/TextInput';
import Select from '@/components/atoms/Select/Select';
import { useMasterStore } from '@/stores/useMasterStore';
import { Karyawan } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';
import FormKaryawan from './FormKaryawan';
import styles from './MasterKaryawanView.module.css';

export default function MasterKaryawanView() {
  const { karyawan, addKaryawan, updateKaryawan, removeKaryawan } = useMasterStore();
  const [search, setSearch] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Karyawan | null>(null);

  const jabatans = Array.from(new Set(karyawan.map(k => k.jabatan)));
  const jabatanOptions = [{ value: 'Semua', label: 'Semua Jabatan' }, ...jabatans.map(j => ({ value: j, label: j }))];
  const statusOptions = [
    { value: 'Semua', label: 'Semua Status' },
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Nonaktif', label: 'Nonaktif' }
  ];

  const filteredData = karyawan.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
    const matchJabatan = filterJabatan === 'Semua' || item.jabatan === filterJabatan;
    const matchStatus = filterStatus === 'Semua' || 
                       (filterStatus === 'Aktif' && item.aktif) || 
                       (filterStatus === 'Nonaktif' && !item.aktif);
    return matchSearch && matchJabatan && matchStatus;
  });

  const totalKaryawan = karyawan.length;
  const totalAktif = karyawan.filter(k => k.aktif).length;
  const totalNonaktif = totalKaryawan - totalAktif;

  const handleToggleAktif = (item: Karyawan) => {
    updateKaryawan(item.id, { aktif: !item.aktif });
  };

  const handleSubmit = (data: Partial<Karyawan>) => {
    if (editingItem) {
      updateKaryawan(editingItem.id, data);
    } else {
      addKaryawan({
        id: `KRY-${Date.now()}`,
        nama: data.nama!,
        jabatan: data.jabatan!,
        aktif: data.aktif !== undefined ? data.aktif : true,
        tahapList: data.tahapList || [],
        gajiPokok: data.gajiPokok || 0
      });
    }
  };

  const columns: Column<Karyawan>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'jabatan', header: 'Jabatan' },
    { key: 'gajiPokok', header: 'Gaji Pokok', render: (v) => <span className={styles.money}>{formatRupiah(v)}</span> },
    { key: 'status', header: 'Status', render: (_, row) => (
      <Badge variant={row.aktif ? 'success' : 'neutral'}>{row.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
    )},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => handleToggleAktif(row)}>
          {row.aktif ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
      </div>
    )}
  ];

  return (
    <PageWrapper 
      title="Karyawan" 
      subtitle="Manajemen Data Karyawan"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Karyawan
        </Button>
      }
    >
      <div className={styles.container}>
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Karyawan</span>
            <span className={styles.kpiValue}>{totalKaryawan}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Karyawan Aktif</span>
            <span className={styles.kpiValue} style={{ color: 'var(--color-success)' }}>{totalAktif}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Karyawan Nonaktif</span>
            <span className={styles.kpiValue} style={{ color: 'var(--color-text-sub)' }}>{totalNonaktif}</span>
          </div>
        </div>

        <Panel title="Daftar Karyawan">
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <TextInput value={search} onChange={setSearch} placeholder="Cari by nama..." />
            </div>
            <div className={styles.filterBox}>
              <Select value={filterJabatan} onChange={setFilterJabatan} options={jabatanOptions} />
            </div>
            <div className={styles.filterBox}>
              <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} />
            </div>
          </div>

          <DataTable columns={columns} data={filteredData} keyField="id" />
        </Panel>
      </div>

      <FormKaryawan 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialValues={editingItem} 
        onSubmit={handleSubmit} 
      />
    </PageWrapper>
  );
}
