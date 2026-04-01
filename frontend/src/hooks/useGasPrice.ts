'use client';

import { usePublicClient } from 'wagmi';
import { useCallback } from 'react';

export function useGasOverrides() {
  const publicClient = usePublicClient();

  const getGasOverrides = useCallback(async (): Promise<Record<string, bigint>> => {
    if (!publicClient) return {};
    try {
      const feeData = await publicClient.estimateFeesPerGas();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        return {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        };
      }
      const gasPrice = await publicClient.getGasPrice();
      if (gasPrice > 0n) {
        return { gasPrice };
      }
    } catch {}
    return {};
  }, [publicClient]);

  return { getGasOverrides };
}
