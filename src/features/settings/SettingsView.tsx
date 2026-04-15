'use client';

import React, { useState } from 'react';
import { Sun, Moon, ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Heading, Label } from '@/components/atoms/Typography';
import Button from '@/components/atoms/Button';
import styles from './SettingsView.module.css';

export default function SettingsView() {
  const { theme, setTheme, beam, updateBeam } = useSettingsStore();
  const { currentUser, ownerPin, setOwnerPin } = useAuthStore();

  // ── State PIN Form ─────────────────────────────────────────────────────────
  const [pinLama, setPinLama] = useState('');
  const [pinBaru, setPinBaru] = useState('');
  const [pinKonfirmasi, setPinKonfirmasi] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinStatus, setPinStatus] = useState<'idle' | 'success' | 'error_lama' | 'error_match' | 'error_length'>('idle');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const isOwner = currentUser?.roles.includes('owner') || currentUser?.roles.includes('godadmin');

  const handleGantiPin = async () => {
    // Validasi
    if (pinLama !== ownerPin) {
      setPinStatus('error_lama');
      return;
    }
    if (pinBaru.length < 4) {
      setPinStatus('error_length');
      return;
    }
    if (pinBaru !== pinKonfirmasi) {
      setPinStatus('error_match');
      return;
    }

    setIsSavingPin(true);
    await setOwnerPin(pinBaru);
    setIsSavingPin(false);
    setPinStatus('success');
    setPinLama('');
    setPinBaru('');
    setPinKonfirmasi('');

    // Reset status setelah 3 detik
    setTimeout(() => setPinStatus('idle'), 3000);
  };

  return (
    <div className={styles.container}>
      {/* Section 1: Themes */}
      <section className={styles.section}>
        <Heading level={4}>Mode Tampilan</Heading>
        <div className={styles.card}>
          <div className={styles.themeButtons}>
            <button 
              className={styles.themeBtn} 
              data-active={theme === 'light'} 
              onClick={() => setTheme('light')}
            >
              <div className={`${styles.themePreview} ${styles.lightPreview}`} />
              <Sun size={16} />
              <span>Mode Terang</span>
            </button>
            <button 
              className={styles.themeBtn} 
              data-active={theme === 'dark'} 
              onClick={() => setTheme('dark')}
            >
              <div className={`${styles.themePreview} ${styles.darkPreview}`} />
              <Moon size={16} />
              <span>Mode Gelap</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Keamanan PIN — hanya tampil untuk Owner/Godadmin */}
      {isOwner && (
        <section className={styles.section}>
          <Heading level={4}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} /> Keamanan
            </span>
          </Heading>
          <div className={styles.card}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <div className={styles.title}>PIN Owner</div>
                <div className={styles.description}>
                  PIN ini digunakan untuk mengkonfirmasi aksi-aksi berisiko tinggi di sistem.
                </div>
              </div>
            </div>

            <div className={styles.pinForm}>
              {/* PIN Lama */}
              <div className={styles.pinField}>
                <Label>PIN Saat Ini</Label>
                <div className={styles.pinInputWrapper}>
                  <input
                    type={showPins ? 'text' : 'password'}
                    className={styles.pinInput}
                    value={pinLama}
                    onChange={(e) => { setPinLama(e.target.value); setPinStatus('idle'); }}
                    placeholder="••••"
                    maxLength={8}
                  />
                </div>
                {pinStatus === 'error_lama' && (
                  <span className={styles.pinError}>PIN saat ini salah.</span>
                )}
              </div>

              {/* PIN Baru */}
              <div className={styles.pinField}>
                <Label>PIN Baru</Label>
                <div className={styles.pinInputWrapper}>
                  <input
                    type={showPins ? 'text' : 'password'}
                    className={styles.pinInput}
                    value={pinBaru}
                    onChange={(e) => { setPinBaru(e.target.value); setPinStatus('idle'); }}
                    placeholder="••••"
                    maxLength={8}
                  />
                </div>
                {pinStatus === 'error_length' && (
                  <span className={styles.pinError}>PIN minimal 4 karakter.</span>
                )}
              </div>

              {/* Konfirmasi PIN */}
              <div className={styles.pinField}>
                <Label>Konfirmasi PIN Baru</Label>
                <div className={styles.pinInputWrapper}>
                  <input
                    type={showPins ? 'text' : 'password'}
                    className={styles.pinInput}
                    value={pinKonfirmasi}
                    onChange={(e) => { setPinKonfirmasi(e.target.value); setPinStatus('idle'); }}
                    placeholder="••••"
                    maxLength={8}
                  />
                </div>
                {pinStatus === 'error_match' && (
                  <span className={styles.pinError}>PIN baru tidak cocok.</span>
                )}
              </div>

              {/* Kontrol */}
              <div className={styles.pinActions}>
                <button
                  className={styles.showHideBtn}
                  onClick={() => setShowPins(v => !v)}
                  type="button"
                >
                  {showPins ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPins ? 'Sembunyikan' : 'Tampilkan'} PIN
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGantiPin}
                  disabled={!pinLama || !pinBaru || !pinKonfirmasi || isSavingPin}
                >
                  {isSavingPin ? 'Menyimpan...' : 'Simpan PIN Baru'}
                </Button>
              </div>

              {/* Feedback */}
              {pinStatus === 'success' && (
                <div className={styles.pinSuccess}>
                  <CheckCircle size={16} />
                  PIN berhasil diperbarui dan disimpan ke server.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Border Beams */}
      <section className={styles.section}>
        <Heading level={4}>Efek Perbatasan (Border Beam)</Heading>
        
        <div className={styles.card}>
          {/* Toggle Enabled */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.title}>Aktifkan Border Beam</div>
              <div className={styles.description}>Garis bercahaya yang berputar di sekeliling tabel data.</div>
            </div>
            <div className={styles.control}>
              <label className={styles.toggle}>
                <input 
                  type="checkbox" 
                  checked={beam.enabled} 
                  onChange={(e) => updateBeam({ enabled: e.target.checked })} 
                />
                <span className={styles.sliderToggle}></span>
              </label>
            </div>
          </div>

          {/* Beam Size */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.title}>Ketebalan Garis</div>
              <div className={styles.description}>Ukuran ketebalan berkas cahaya (px).</div>
            </div>
            <div className={styles.control}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '200px' }}>
                <input 
                  type="range" 
                  min="1" max="8" step="1"
                  className={styles.slider}
                  value={beam.size}
                  onChange={(e) => updateBeam({ size: parseInt(e.target.value) })}
                />
                <span style={{ minWidth: '30px', textAlign: 'right', fontSize: '13px' }}>{beam.size}px</span>
              </div>
            </div>
          </div>

          {/* Beam Speed */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.title}>Kecepatan Rotasi</div>
              <div className={styles.description}>Waktu yang dibutuhkan untuk satu putaran penuh (detik).</div>
            </div>
            <div className={styles.control}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '200px' }}>
                <input 
                  type="range" 
                  min="1" max="10" step="1"
                  className={styles.slider}
                  value={beam.duration}
                  onChange={(e) => updateBeam({ duration: parseInt(e.target.value) })}
                  style={{ direction: 'rtl' }} // Invert so left is faster (less seconds)
                />
                <span style={{ minWidth: '30px', textAlign: 'right', fontSize: '13px' }}>{beam.duration}s</span>
              </div>
            </div>
          </div>

          {/* Beam Colors */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.title}>Warna Gradien</div>
              <div className={styles.description}>Sesuaikan perpaduan dua warna garis cahaya.</div>
            </div>
            <div className={styles.control}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="color" 
                  className={styles.colorInput}
                  value={beam.color1}
                  onChange={(e) => updateBeam({ color1: e.target.value })}
                />
                <input 
                  type="color" 
                  className={styles.colorInput}
                  value={beam.color2}
                  onChange={(e) => updateBeam({ color2: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Glow Intensity */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.title}>Intensitas Cahaya (Glow)</div>
              <div className={styles.description}>Menghidupkan efek pendaran cahaya di sekitar garis.</div>
            </div>
            <div className={styles.control}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '200px' }}>
                <input 
                  type="range" 
                  min="0" max="12" step="1"
                  className={styles.slider}
                  value={beam.blur}
                  onChange={(e) => updateBeam({ blur: parseInt(e.target.value) })}
                />
                <span style={{ minWidth: '30px', textAlign: 'right', fontSize: '13px' }}>{beam.blur}px</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={styles.previewArea}>
            <div className={styles.previewBox}>
              <div className="beam-border" aria-hidden="true" />
              CONTOH TAMPILAN TABEL
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
