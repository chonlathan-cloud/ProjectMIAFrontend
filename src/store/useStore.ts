import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* =======================
   Types
======================= */

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

export interface StoreInfo {
  id: string;
  name?: string;
}

/* =======================
   App State
======================= */

interface AppState {
  /* core */
  user: User | null;
  theme: 'light';

  /** 🔥 auth lifecycle */
  authReady: boolean;

  /* tenant / store */
  stores: StoreInfo[];
  store: StoreInfo | null;
  activeStoreId: string | null;

  /* integrations */
  lineOA: LineOA;

  /* actions */
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  setTheme: (theme: 'light') => void;

  setStores: (stores: StoreInfo[]) => void;
  setActiveStoreById: (storeId: string) => void;
  setStore: (store: StoreInfo | null) => void;

  setLineOA: (lineOA: Partial<LineOA>) => void;
  resetStore: () => void;
  logout: () => void;
}

/* =======================
   Store
======================= */

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ---------- initial state ---------- */
      user: null,
      theme: 'light',
      authReady: false,

      stores: [],
      store: null,
      activeStoreId: null,

      lineOA: { connected: false },

      /* ---------- actions ---------- */

      setUser: (user) => set({ user }),

      setAuthReady: (ready) => set({ authReady: ready }),

      setTheme: () => set({ theme: 'light' }),

      setStores: (stores) => {
        const { store } = get();

        // ถ้ายังไม่มี active store → ตั้งร้านแรกอัตโนมัติ
        if (!store && stores.length > 0) {
          set({
            stores,
            store: stores[0],
            activeStoreId: stores[0].id,
          });
        } else {
          set({ stores });
        }
      },

      setActiveStoreById: (storeId) => {
        const { stores } = get();
        const next = stores.find((s) => s.id === storeId) || null;

        set({
          store: next,
          activeStoreId: next?.id ?? null,
          lineOA: { connected: false }, // ป้องกัน OA ข้าม tenant
        });
      },

      // compat กับโค้ดเดิม
      setStore: (store) =>
        set({
          store,
          activeStoreId: store?.id ?? null,
        }),

      setLineOA: (lineOA) =>
        set((state) => ({
          lineOA: { ...state.lineOA, ...lineOA },
        })),

      resetStore: () =>
        set({
          store: null,
          activeStoreId: null,
          lineOA: { connected: false },
        }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firebase_token');
          localStorage.removeItem('lineboost-storage');
        }

        set({
          user: null,
          authReady: false,
          stores: [],
          store: null,
          activeStoreId: null,
          lineOA: { connected: false },
        });
      },
    }),
    {
      name: 'lineboost-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        store: state.store,
        activeStoreId: state.activeStoreId,
      }),
    }
  )
);
