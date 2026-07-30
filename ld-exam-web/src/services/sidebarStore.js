import { create } from 'zustand';

// Shared collapsed/expanded state for the student sidebar, toggled by the
// hamburger (☰) button in each page's header. Starts collapsed on phone-sized
// screens so the sidebar doesn't cover the whole viewport on first load.
const useSidebarStore = create((set) => ({
  collapsed: typeof window !== 'undefined' && window.innerWidth <= 768,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  close: () => set({ collapsed: true }),
}));

export default useSidebarStore;
