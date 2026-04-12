import React from 'react';
import Badge from '../../../components/atoms/Badge';
import styles from '../Panduan.module.css';

const roles = [
  {
    initial: 'O',
    name: 'Owner',
    color: 'var(--color-cyan)',
    desc: 'Akses penuh seluruh sistem. Bisa melihat HPP & Margin, mengedit Master Data, meng-approve koreksi, mengelola kasbon, dan input bonus. Memiliki kode override untuk validasi lapangan.',
    perms: ['Akses Penuh', 'Lihat HPP/Margin', 'Edit Master Data', 'Approve Koreksi', 'Kelola Kasbon'],
  },
  {
    initial: 'AP',
    name: 'Admin Produksi',
    color: 'var(--color-green)',
    desc: 'Mengelola scan station dan proses produksi sehari-hari. Bisa mengajukan koreksi data. TIDAK bisa melihat data margin atau HPP.',
    perms: ['Dashboard Produksi', 'Scan Station', 'Ajukan Koreksi'],
  },
  {
    initial: 'AK',
    name: 'Admin Keuangan',
    color: 'var(--color-blue)',
    desc: 'Mengelola jurnal umum dan melihat semua laporan keuangan. Bisa melihat data HPP & Margin. Tidak bisa mengedit Master Data.',
    perms: ['Keuangan', 'Laporan', 'Lihat HPP/Margin'],
  },
  {
    initial: 'SV',
    name: 'Supervisor',
    color: 'var(--color-purple)',
    desc: 'Melihat dashboard dan laporan. Mengelola penggajian dengan tombol approve. Bisa melihat HPP & Margin untuk kalkulasi biaya.',
    perms: ['Dashboard', 'Penggajian', 'Keuangan (View Only)'],
  },
  {
    initial: 'M',
    name: 'Mandor',
    color: 'var(--color-yellow)',
    desc: 'Hanya mengakses scanner station di area Produksi. Tersedia 3 akun mandor secara default. Akses paling terbatas dalam sistem.',
    perms: ['Scan Station Only'],
  },
];

export default function SectionRoles() {
  return (
    <div className={styles.roleGrid}>
      {roles.map(role => (
        <div key={role.name} className={styles.roleCard}>
          <div className={styles.roleBadge} style={{ background: role.color }}>
            {role.initial}
          </div>
          <div className={styles.roleContent}>
            <span className={styles.roleName}>{role.name}</span>
            <p className={styles.roleDesc}>{role.desc}</p>
            <div className={styles.rolePerms}>
              {role.perms.map(p => (
                <Badge key={p} variant="neutral" size="sm">{p}</Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
