'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Label, Heading } from '@/components/atoms/Typography';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { useMasterStore } from '@/stores/useMasterStore';
import { useReturnStore } from '@/stores/useReturnStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import styles from './Retur.module.css';

export default function StationPerbaikanView() {
  const { karyawan } = useMasterStore();
  const { returns, updateReturnStatus, getReturnByBarcode } = useReturnStore();
  const { addLedgerEntry } = usePayrollStore();

  const [search, setSearch] = useState('');
  const [foundReturn, setFoundReturn] = useState<any>(null);
  const [assignmentType, setAssignmentType] = useState<'self' | 'other'>('self');
  const [selectedKaryawan, setSelectedKaryawan] = useState('');

  // Filtering for the two tables
  const queueList = returns.filter(r => r.status === 'diterima');
  const activeList = returns.filter(r => r.status === 'proses_perbaikan' || r.status === 'siap_kirim');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ret = getReturnByBarcode(search);
    if (ret && (ret.status === 'diterima' || ret.status === 'proses_perbaikan')) {
      setFoundReturn(ret);
      setAssignmentType(ret.isSelfRepair ? 'self' : (ret.karyawanPerbaikan ? 'other' : 'self'));
      setSelectedKaryawan(ret.karyawanPerbaikan || '');
    } else {
      alert('Barcode tidak ditemukan di daftar retur aktif.');
    }
  };

  const handleAssign = () => {
    if (assignmentType === 'other' && !selectedKaryawan) return alert('Pilih penjahit pengganti');
    
    const repairerId = assignmentType === 'self' ? foundReturn.karyawanOriginal : selectedKaryawan;
    const now = new Date().toISOString();

    // 1. Create PENDING (Escrow) Ledger Entry
    // This is the money that WILL be paid/restored ONLY IF the item is shipped.
    addLedgerEntry({
      id: `ESC-RET-${Date.now()}`,
      karyawanId: repairerId,
      tanggal: now,
      keterangan: assignmentType === 'self' 
        ? `RESTITUSI PERBAIKAN (SELF) - ${foundReturn.barcode}`
        : `UPAH PERBAIKAN (OTHER) - ${foundReturn.barcode}`,
      sumberId: foundReturn.barcode,
      total: foundReturn.nominalPotongan, // The original wage amount
      tipe: assignmentType === 'self' ? 'rework' : 'selesai',
      status: 'escrow' // Key: Not in payroll balance until activated
    });

    // 2. Update Return Store
    updateReturnStatus(foundReturn.id, 'siap_kirim', {
      karyawanPerbaikan: repairerId,
      isSelfRepair: assignmentType === 'self',
      waktuPerbaikan: now
    });

    alert(`Tugas perbaikan berhasil diberikan ke ${karyawan.find(k => k.id === repairerId)?.nama}. Upah akan cair setelah barang dikirim.`);
    setFoundReturn(null);
    setSearch('');
  };

  return (
    <PageWrapper title="Station Penugasan Perbaikan" subtitle="Tentukan siapa yang bertanggung jawab memperbaiki barang retur.">
      <div className={styles.container}>
        <Panel title="Scan Barcode Perbaikan">
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Scan barcode perbaikan..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <Button variant="primary" type="submit">Cari</Button>
          </form>
        </Panel>

        {foundReturn && (
          <div className={styles.resultGrid}>
            <Panel title="Data Retur (Scan Result)">
              <div className={styles.infoList}>
                <div className={styles.infoRow}><Label>Barcode</Label><strong>{foundReturn.barcode}</strong></div>
                <div className={styles.infoRow}><Label>Penjahit Asal</Label><strong>{karyawan.find(k => k.id === foundReturn.karyawanOriginal)?.nama || foundReturn.karyawanOriginal}</strong></div>
                <div className={styles.infoRow}><Label>Alasan</Label><Badge variant="danger">{foundReturn.alasanRejectId}</Badge></div>
                <div className={styles.infoRow}><Label>QTY Retur</Label><strong>{foundReturn.qtyBundle || 1} Pcs (Locked)</strong></div>
              </div>
            </Panel>

            <Panel title="Penugasan Perbaikan" accent="cyan">
              <div className={styles.form}>
                <div className={styles.field}>
                  <Label>Opsi Perbaikan</Label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioItem}>
                      <input 
                        type="radio" 
                        name="assign" 
                        checked={assignmentType === 'self'} 
                        onChange={() => setAssignmentType('self')} 
                      />
                      <span>Perbaiki Sendiri (Restitusi/Upah Kembali)</span>
                    </label>
                    <label className={styles.radioItem}>
                      <input 
                        type="radio" 
                        name="assign" 
                        checked={assignmentType === 'other'} 
                        onChange={() => setAssignmentType('other')} 
                      />
                      <span>Dikerjakan Orang Lain (Bayar Baru)</span>
                    </label>
                  </div>
                </div>

                {assignmentType === 'other' && (
                  <div className={styles.field}>
                    <Label>Pilih Penjahit Baru</Label>
                    <select value={selectedKaryawan} onChange={e => setSelectedKaryawan(e.target.value)}>
                      <option value="">-- Pilih Penjahit --</option>
                      {karyawan
                        .filter(k => k.tahapList?.includes('jahit') && k.id !== foundReturn.karyawanOriginal)
                        .map(k => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.financialPreview}>
                  <Label>Status Finansial:</Label>
                  <Heading level={4} color={assignmentType === 'self' ? 'cyan' : 'yellow'}>
                    {assignmentType === 'self' ? 'UPAH TERTAHAN (RESTITUSI)' : 'UPAH ORANG LAIN (PAID)'} 
                    {' - '} {formatRupiah(foundReturn.nominalPotongan)}
                  </Heading>
                </div>

                <Button variant="primary" fullWidth onClick={handleAssign}>
                  Konfirmasi Penugasan
                </Button>
              </div>
            </Panel>
          </div>
        )}

        <div className={styles.tableSection}>
          <Panel title="1. List Antrian Perbaikan (Queue)" accent="red">
            <DataTable 
              columns={[
                { key: 'barcode', header: 'Barcode' },
                { key: 'artikelNama', header: 'Artikel' },
                { key: 'waktuDiterima', header: 'Tgl Retur', render: v => formatDate(v) },
                { key: 'karyawanOriginal', header: 'Penjahit Asal', render: v => karyawan.find(k => k.id === v)?.nama || v }
              ]} 
              data={queueList} 
              keyField="id" 
            />
          </Panel>

          <Panel title="2. List Penugasan Aktif (In Progress)" accent="green">
            <DataTable 
              columns={[
                { key: 'barcode', header: 'Barcode' },
                { key: 'karyawanPerbaikan', header: 'Dikerjakan Oleh', render: v => karyawan.find(k => k.id === v)?.nama || v },
                { 
                  key: 'isSelfRepair', 
                  header: 'Tipe Upah', 
                  render: (v, r) => (
                    <Badge variant={v ? 'info' : 'warning'}>
                      {v ? 'Ter-Restitusi' : 'Upah Orang Lain'}
                    </Badge>
                  )
                },
                { key: 'nominalPotongan', header: 'Nominal', render: v => formatRupiah(v) },
                { 
                  key: 'status', 
                  header: 'Status', 
                  render: v => <Badge variant="neutral">{v.toUpperCase()}</Badge> 
                }
              ]} 
              data={activeList} 
              keyField="id" 
            />
          </Panel>
        </div>
      </div>
    </PageWrapper>
  );
}
