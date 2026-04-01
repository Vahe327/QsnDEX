import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedChainId } from '@/config/chains';
import { DEFAULT_CHAIN } from '@/config/chains';

interface ChainState {
  selectedChainId: SupportedChainId;
  setSelectedChainId: (chainId: SupportedChainId) => void;
}

export const useChainStore = create<ChainState>()(
  persist(
    (set) => ({
      selectedChainId: DEFAULT_CHAIN.id as SupportedChainId,
      setSelectedChainId: (selectedChainId) => set({ selectedChainId }),
    }),
    { name: 'qsndex-chain' }
  )
);
