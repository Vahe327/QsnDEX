import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  slippage: number; // in basis points (50 = 0.5%)
  deadline: number; // in minutes
  multihop: boolean;
  infiniteApproval: boolean;
  locale: string;
  theme: 'dark' | 'light';
  setSlippage: (v: number) => void;
  setDeadline: (v: number) => void;
  setMultihop: (v: boolean) => void;
  setInfiniteApproval: (v: boolean) => void;
  setLocale: (v: string) => void;
  setTheme: (v: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      slippage: 50,
      deadline: 20,
      multihop: true,
      infiniteApproval: true,
      locale: 'en',
      theme: 'dark',
      setSlippage: (slippage) => set({ slippage }),
      setDeadline: (deadline) => set({ deadline }),
      setMultihop: (multihop) => set({ multihop }),
      setInfiniteApproval: (infiniteApproval) => set({ infiniteApproval }),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'qsndex-settings' }
  )
);
