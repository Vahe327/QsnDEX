import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TokenInfo } from '@/config/tokens';

interface TokenState {
  customTokens: TokenInfo[];
  recentTransactions: {
    type: string;
    description: string;
    txHash: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: number;
  }[];
  addCustomToken: (token: TokenInfo) => void;
  removeCustomToken: (address: string) => void;
  addTransaction: (tx: { type: string; description: string; txHash: string; status: 'pending' | 'success' | 'failed' }) => void;
  updateTransaction: (txHash: string, status: 'success' | 'failed') => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      customTokens: [],
      recentTransactions: [],
      addCustomToken: (token) =>
        set((state) => {
          if (state.customTokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase())) {
            return state;
          }
          return { customTokens: [...state.customTokens, token] };
        }),
      removeCustomToken: (address) =>
        set((state) => ({
          customTokens: state.customTokens.filter(
            (t) => t.address.toLowerCase() !== address.toLowerCase()
          ),
        })),
      addTransaction: (tx) =>
        set((state) => ({
          recentTransactions: [
            { ...tx, timestamp: Date.now() },
            ...state.recentTransactions.slice(0, 19),
          ],
        })),
      updateTransaction: (txHash, status) =>
        set((state) => ({
          recentTransactions: state.recentTransactions.map((tx) =>
            tx.txHash === txHash ? { ...tx, status } : tx
          ),
        })),
    }),
    { name: 'qsndex-tokens' }
  )
);
