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
  connected: boolean;
  name?: string;
  id?: string;
  followers?: number;
  responseRate?: number;
}

interface AppState {
  user: User | null;
  lineOA: LineOA;
  theme: 'light';

  setUser: (user: User | null) => void;
  setLineOA: (lineOA: Partial<LineOA>) => void;
  setTheme: (theme: 'light') => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      lineOA: {
        connected: false,
      },
      theme: 'light',

      setUser: (user) => set({ user }),
      setLineOA: (lineOA) => set((state) => ({
        lineOA: { ...state.lineOA, ...lineOA }
      })),
      setTheme: () => set({ theme: 'light' }),
      logout: () => set({ user: null, lineOA: { connected: false } }),
    }),
    {
      name: 'lineboost-storage',
    }
  )
);
