'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Panel from '@/components/molecules/Panel';
import TextInput from '@/components/atoms/Input/TextInput';
import Button from '@/components/atoms/Button';
import { Heading, Label } from '@/components/atoms/Typography';
import styles from './Login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [visitorPass, setVisitorPass] = useState('');
  
  const { login, loginAsVisitor } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      router.push('/dashboard/produksi');
    } else {
      alert(result.message);
    }
  };

  const handleVisitorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginAsVisitor(visitorPass);
    if (result.success) {
      router.push('/dashboard/produksi');
    } else {
      alert(result.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Heading level={2} className={styles.logo}>STITCHLYX<span style={{ color: 'var(--color-cyan)' }}>.SYNCORE</span></Heading>
        <Label color="sub">{isVisitorMode ? 'Guest Access Control' : 'Sign in to your account'}</Label>
      </div>
      
      <Panel title={isVisitorMode ? '🔓 Akses Pengunjung' : 'Login'}>
        {!isVisitorMode ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <Label>Username</Label>
              <TextInput 
                value={username}
                onChange={(val) => setUsername(val)}
                placeholder="Enter username"
                required
              />
            </div>
            <div className={styles.field}>
              <Label>Password / PIN</Label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or PIN"
                required
                className={styles.pwdInput}
              />
            </div>
            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '12px' }}>
              Masuk ke Sistem
            </Button>

            <div className={styles.divider}>
              <span>ATAU</span>
            </div>

            <Button 
               type="button" 
               variant="ghost" 
               onClick={() => setIsVisitorMode(true)}
               style={{ width: '100%', border: '1px dashed var(--color-border)' }}
            >
              👤 Masuk sebagai Pengunjung
            </Button>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Belum punya akun? </span>
              <button 
                type="button"
                onClick={() => router.push('/register')}
                style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Daftar Sekarang
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVisitorLogin} className={styles.form}>
            <div className={styles.field}>
              <Label>Password Pengunjung</Label>
              <input 
                type="password"
                value={visitorPass}
                onChange={(e) => setVisitorPass(e.target.value)}
                placeholder="Masukkan password tamu..."
                autoFocus
                required
                className={styles.pwdInput}
              />
            </div>
            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '12px' }}>
              Buka Akses Tamu
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsVisitorMode(false)}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Kembali ke Login User
            </Button>
          </form>
        )}
      </Panel>
    </div>
  );
}
