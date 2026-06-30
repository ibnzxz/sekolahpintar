import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  toggleTheme: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  fontSize: 'medium',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setFontSize: (size) => set({ fontSize: size }),
}));
