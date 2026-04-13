'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function SettingsInjector() {
  const { theme, beam } = useSettingsStore();

  useEffect(() => {
    // 1. Apple Theme
    document.documentElement.setAttribute('data-theme', theme);

    // 2. Apply Beam Variables to root
    const root = document.documentElement;
    root.style.setProperty('--beam-size', `${beam.size}px`);
    root.style.setProperty('--beam-duration', `${beam.duration}s`);
    root.style.setProperty('--beam-color-1', beam.color1);
    root.style.setProperty('--beam-color-2', beam.color2);
    root.style.setProperty('--beam-glow', `blur(${beam.blur}px)`);
    root.style.setProperty('--beam-display', beam.enabled ? 'block' : 'none');
    
  }, [theme, beam]);

  return null; // This is a logic-only component
}
