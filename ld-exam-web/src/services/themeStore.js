import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
  // 'light' or 'dark'
  mode: localStorage.getItem('ld-theme-mode') || 'light',
  // 'small', 'medium', 'big'
  fontSize: localStorage.getItem('ld-font-size') || 'medium',
  // derived boolean for teacher portal
  isDark: (localStorage.getItem('ld-theme-mode') || 'light') === 'dark',

  // Student portal methods
  toggleMode: () => set((state) => {
    const next = state.mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('ld-theme-mode', next);
    return { mode: next, isDark: next === 'dark' };
  }),

  setFontSize: (size) => set(() => {
    localStorage.setItem('ld-font-size', size);
    return { fontSize: size };
  }),

  // Teacher portal compatibility
  toggleTheme: () => set((state) => {
    const next = state.mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('ld-theme-mode', next);
    return { mode: next, isDark: next === 'dark' };
  }),

  initTheme: () => {
    const saved = localStorage.getItem('ld-theme-mode') || 'light';
    set({ mode: saved, isDark: saved === 'dark' });
  },
}));

export default useThemeStore;
