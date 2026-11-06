import { create } from 'zustand';
import { Citation } from '../services/api';

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('folioq_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const initialDarkMode = getInitialDarkMode();
if (typeof document !== 'undefined') {
  if (initialDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

interface UIState {
  activeCollectionId: string | null;
  activeThreadId: string | null;
  activeDocumentId: string | null;
  selectedCitation: Citation | null;
  viewerOpen: boolean;
  viewerPage: number;
  darkMode: boolean;
  commandPaletteOpen: boolean;
  uploadModalOpen: boolean;
  elementInspectorDocId: string | null;

  setActiveCollection: (id: string | null) => void;
  setActiveThread: (id: string | null) => void;
  setActiveDocument: (id: string | null) => void;
  openCitationInViewer: (citation: Citation) => void;
  setViewerOpen: (open: boolean) => void;
  setViewerPage: (page: number) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setUploadModalOpen: (open: boolean) => void;
  setElementInspectorDocId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeCollectionId: null,
  activeThreadId: null,
  activeDocumentId: null,
  selectedCitation: null,
  viewerOpen: false,
  viewerPage: 1,
  darkMode: initialDarkMode,
  commandPaletteOpen: false,
  uploadModalOpen: false,
  elementInspectorDocId: null,

  setActiveCollection: (id) => set({ activeCollectionId: id, activeThreadId: null }),
  setActiveThread: (id) => set({ activeThreadId: id }),
  setActiveDocument: (id) => set({ activeDocumentId: id }),

  openCitationInViewer: (citation) => {
    set({
      selectedCitation: citation,
      activeDocumentId: citation.documentId,
      viewerPage: citation.page,
      viewerOpen: true,
    });
  },

  setViewerOpen: (open) => set({ viewerOpen: open }),
  setViewerPage: (page) => set({ viewerPage: page }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('folioq_theme', next ? 'dark' : 'light');
        } catch {}
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { darkMode: next };
    }),

  setDarkMode: (dark: boolean) =>
    set(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('folioq_theme', dark ? 'dark' : 'light');
        } catch {}
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { darkMode: dark };
    }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
  setElementInspectorDocId: (id) => set({ elementInspectorDocId: id }),
}));
