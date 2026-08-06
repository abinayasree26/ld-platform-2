import { create } from 'zustand';

const applyDOMTheme = (mode) => {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark', 'ld-dark');
  } else {
    root.classList.remove('dark', 'ld-dark');
  }
};

// Initial DOM sync on module load
applyDOMTheme(localStorage.getItem('ld-theme-mode') || 'light');

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
    applyDOMTheme(next);
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
    applyDOMTheme(next);
    return { mode: next, isDark: next === 'dark' };
  }),

  initTheme: () => {
    const saved = localStorage.getItem('ld-theme-mode') || 'light';
    applyDOMTheme(saved);
    set({ mode: saved, isDark: saved === 'dark' });
  },
}));

export default useThemeStore;
