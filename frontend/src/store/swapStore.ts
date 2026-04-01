import { create } from 'zustand';

interface SwapState {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  mode: 'market' | 'limit';
  limitPrice: string;
  setTokenIn: (v: string) => void;
  setTokenOut: (v: string) => void;
  setAmountIn: (v: string) => void;
  setAmountOut: (v: string) => void;
  setMode: (v: 'market' | 'limit') => void;
  setLimitPrice: (v: string) => void;
  reverseTokens: () => void;
  reset: () => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  tokenIn: '',
  tokenOut: '',
  amountIn: '',
  amountOut: '',
  mode: 'market',
  limitPrice: '',
  setTokenIn: (tokenIn) => set({ tokenIn }),
  setTokenOut: (tokenOut) => set({ tokenOut }),
  setAmountIn: (amountIn) => set({ amountIn }),
  setAmountOut: (amountOut) => set({ amountOut }),
  setMode: (mode) => set({ mode }),
  setLimitPrice: (limitPrice) => set({ limitPrice }),
  reverseTokens: () =>
    set((state) => ({
      tokenIn: state.tokenOut,
      tokenOut: state.tokenIn,
      amountIn: state.amountOut,
      amountOut: state.amountIn,
    })),
  reset: () => set({ amountIn: '', amountOut: '', limitPrice: '' }),
}));
