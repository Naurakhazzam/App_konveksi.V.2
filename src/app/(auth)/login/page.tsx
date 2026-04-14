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
  const login = useAuthStore(state => state.login);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(username, password);
    if (result.success) {
      router.push('/dashboard/produksi');
    } else {
      alert(result.message); // Temporarily using alert, can use toast if available
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Heading level={2} className={styles.logo}>STITCHLYX<span style={{ color: 'var(--color-cyan)' }}>.SYNCORE</span></Heading>
        <Label color="sub">Sign in to your account</Label>
      </div>
      
      <Panel title="Login">
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
            <Label>Password</Label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className={styles.pwdInput}
            />
          </div>
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '12px' }}>
            Masuk
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
      </Panel>
    </div>
  );
}
