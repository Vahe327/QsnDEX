'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { ROUTER_ABI } from '@/config/contracts';
import { useSettingsStore } from '@/store/settingsStore';
import { useChain } from './useChain';
import { useGasOverrides } from '@/hooks/useGasPrice';

interface UseRemoveLiquidityParams {
  tokenA?: string;
  tokenB?: string;
  fee?: number;
  liquidity?: bigint;
  amountAMin?: bigint;
  amountBMin?: bigint;
}

export function useRemoveLiquidity({
  tokenA,
  tokenB,
  fee = 3000,
  liquidity,
  amountAMin: providedAmountAMin,
  amountBMin: providedAmountBMin,
}: UseRemoveLiquidityParams) {
  const { address: account } = useAccount();
  const { contracts } = useChain();
  const slippage = useSettingsStore((s) => s.slippage);
  const deadline = useSettingsStore((s) => s.deadline);

  const [txError, setTxError] = useState<Error | null>(null);
  const { getGasOverrides } = useGasOverrides();

  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const execute = useCallback(
    async (params?: {
      liquidity?: bigint;
      amountAMin?: bigint;
      amountBMin?: bigint;
    }) => {
      const liq = params?.liquidity ?? liquidity;
      if (!account || !tokenA || !tokenB || !liq) {
        throw new Error('Missing remove liquidity parameters');
      }

      setTxError(null);

      try {
        const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadline * 60);
        const slippageMultiplier = BigInt(10_000 - slippage);

        const aMin = params?.amountAMin ?? providedAmountAMin ?? 0n;
        const bMin = params?.amountBMin ?? providedAmountBMin ?? 0n;

        const amountAMinFinal = (aMin * slippageMultiplier) / 10_000n;
        const amountBMinFinal = (bMin * slippageMultiplier) / 10_000n;

        const gas = await getGasOverrides();
        const txHash = await writeContractAsync({
          address: contracts.router as Address,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [
            tokenA as Address,
            tokenB as Address,
            fee,
            liq,
            amountAMinFinal,
            amountBMinFinal,
            account,
            deadlineTimestamp,
          ],
          ...gas,
        });

        return txHash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Remove liquidity failed');
        setTxError(error);
        throw error;
      }
    },
    [account, tokenA, tokenB, fee, liquidity, providedAmountAMin, providedAmountBMin, deadline, slippage, writeContractAsync, contracts.router, getGasOverrides]
  );

  return {
    execute,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    isLoading: isPending || isConfirming,
    error: txError,
    reset,
  };
}
