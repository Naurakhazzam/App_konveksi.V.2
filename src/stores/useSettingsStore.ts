import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BeamSettings {
  enabled: boolean;
  size: number;
  duration: number;
  color1: string;
  color2: string;
  blur: number;
}

interface SettingsState {
  theme: 'dark' | 'light';
  beam: BeamSettings;
  setTheme: (theme: 'dark' | 'light') => void;
  updateBeam: (updates: Partial<BeamSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      beam: {
        enabled: true,
        size: 2,
        duration: 4,
        color1: '#ffcf7d',
        color2: '#d4a017',
        blur: 0,
      },
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
      updateBeam: (updates) => set((state) => ({
        beam: { ...state.beam, ...updates }
      })),
    }),
    {
      name: 'stitchlyx-settings',
    }
  )
);
