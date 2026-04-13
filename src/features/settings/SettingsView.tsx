'use client';

import React from 'react';
import { Sun, Moon, Sparkles, Zap, Palette, Layers } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Heading, Label } from '@/components/atoms/Typography';
import styles from './SettingsView.module.css';

export default function SettingsView() {
  const { theme, setTheme, beam, updateBeam } = useSettingsStore();

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

      {/* Section 2: Border Beams */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Heading level={4}>Efek Perbatasan (Border Beam)</Heading>
        </div>
        
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
