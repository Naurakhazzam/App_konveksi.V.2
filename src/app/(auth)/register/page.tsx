'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Panel from '@/components/molecules/Panel';
import TextInput from '@/components/atoms/Input/TextInput';
import Select from '@/components/atoms/Select/Select';
import Button from '@/components/atoms/Button';
import { Heading, Label } from '@/components/atoms/Typography';
import styles from '../login/Login.module.css';

export default function RegisterPage() {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('supervisor_produksi');
  const [authCode, setAuthCode] = useState('');
  
  const addUser = useAuthStore(state => state.addUser);
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auth Code Validation
    if (authCode !== '123456') {
      alert('Kode Otentikasi Salah! Anda tidak memiliki izin untuk mendaftar.');
      return;
    }

    // Validasi Panjang PIN (Contoh: minimal 4 angka)
    if (pin.length < 4) {
      alert('PIN harus minimal 4 angka!');
      return;
    }

    addUser({
      id: `USR-${Date.now()}`,
      username,
      nama,
      roles: [role],
      pin: pin // Memperbaiki bug: Data sekarang masuk ke kolom PIN yang benar
    } as any);

    alert('Pendaftaran Berhasil! Akun Anda sedang menunggu persetujuan Admin.');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Heading level={2} className={styles.logo}>STITCHLYX<span style={{ color: 'var(--color-cyan)' }}>.SYNCORE</span></Heading>
        <Label color="sub">Create a new staff account</Label>
      </div>
      
      <Panel title="Pendaftaran User Baru">
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.field}>
            <Label>Nama Lengkap</Label>
            <TextInput value={nama} onChange={setNama} placeholder="Nama Lengkap Operator" required />
          </div>
          <div className={styles.field}>
            <Label>Username</Label>
            <TextInput value={username} onChange={setUsername} placeholder="Username unik" required />
          </div>
          <div className={styles.field}>
            <Label>Buat PIN Keamanan</Label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="Masukkan angka PIN (Min. 4 angka)" 
              required 
              className={styles.pwdInput}
            />
          </div>
          <div className={styles.field}>
            <Label>Pilih Peran (Role)</Label>
            <Select 
              value={role} 
              onChange={setRole}
              options={[
                { value: 'supervisor_admin', label: 'Supervisor Admin' },
                { value: 'supervisor_produksi', label: 'Supervisor Produksi' },
              ]}
            />
          </div>
          <div className={styles.field} style={{ background: 'rgba(255, 87, 87, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 87, 87, 0.2)' }}>
            <Label color="sub">Kode Otentikasi Tim</Label>
            <input 
              type="password"
              value={authCode} 
              onChange={(e) => setAuthCode(e.target.value)} 
              placeholder="Masukkan 6 digit kode rahasia tim" 
              required 
              className={styles.pwdInput}
              style={{ borderColor: 'var(--color-danger)' }}
            />
          </div>
          
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '12px' }}>
            Daftar Sekarang
          </Button>

          <Button type="button" variant="ghost" onClick={() => router.push('/login')} style={{ width: '100%', marginTop: '8px' }}>
            Kembali ke Login
          </Button>
        </form>
      </Panel>
    </div>
  );
}
