import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserTier = 'starter' | 'growth' | 'enterprise';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tier: UserTier;
}

interface LineOA {
  connected?: boolean;
  name?: string;
  id?: string;
  followers?: number;
  responseRate?: number;
}

interface StoreInfo {
  id: string;
  name?: string;
}

interface AppState {
  user: User | null;
  lineOA: LineOA;
  theme: 'light';
  store: StoreInfo | null;

  setUser: (user: User | null) => void;
  setLineOA: (lineOA: Partial<LineOA>) => void;
  setTheme: (theme: 'light') => void;
  setStore: (store: StoreInfo | null) => void;
  resetStore: () => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      lineOA: { connected: false },
      theme: 'light',
      store: null,

      setUser: (user) => set({ user }),
      setLineOA: (lineOA) =>
        set((state) => ({ lineOA: { ...state.lineOA, ...lineOA } })),
      setTheme: () => set({ theme: 'light' }),
      setStore: (store) => set({ store }),
      resetStore: () => set({ store: null, lineOA: { connected: false } }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firebase_token');
          localStorage.removeItem('lineboost-storage'); // ⭐ สำคัญ
        }
        set({ user: null, lineOA: { connected: false }, store: null });
      },
    }),
    {
      name: 'lineboost-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        store: state.store, // เก็บ store ล่าสุดที่เลือกไว้
      }),
    }
  )
);
