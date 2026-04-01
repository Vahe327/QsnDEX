'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { useChainStore } from '@/store/chainStore';
import { type Address, parseUnits } from 'viem';
import { ROUTER_ABI } from '@/config/contracts';
import { NATIVE_ETH } from '@/config/tokens';
import { useSettingsStore } from '@/store/settingsStore';
import { useChain } from './useChain';

interface UseAddLiquidityParams {
  tokenA?: string;
  tokenB?: string;
  fee?: number;
  amountA?: string;
  amountB?: string;
  decimalsA?: number;
  decimalsB?: number;
}

export function useAddLiquidity({
  tokenA,
  tokenB,
  fee = 3000,
  amountA,
  amountB,
  decimalsA = 18,
  decimalsB = 18,
}: UseAddLiquidityParams) {
  const { address: account } = useAccount();
  const selectedChainId = useChainStore((s) => s.selectedChainId);
  const publicClient = usePublicClient({ chainId: selectedChainId });
  const { contracts } = useChain();
  const slippage = useSettingsStore((s) => s.slippage);
  const deadline = useSettingsStore((s) => s.deadline);

  const [txError, setTxError] = useState<Error | null>(null);

  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const isNativeA = tokenA === NATIVE_ETH.address;
  const isNativeB = tokenB === NATIVE_ETH.address;
  const isNativePair = isNativeA || isNativeB;

  const execute = useCallback(async () => {
    if (!account || !tokenA || !tokenB || !amountA || !amountB) {
      throw new Error('Missing liquidity parameters');
    }

    setTxError(null);

    try {
      const amountAWei = parseUnits(amountA, decimalsA);
      const amountBWei = parseUnits(amountB, decimalsB);
      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadline * 60);

      const slippageMultiplier = BigInt(10_000 - slippage);
      const amountAMin = (amountAWei * slippageMultiplier) / 10_000n;
      const amountBMin = (amountBWei * slippageMultiplier) / 10_000n;

      let gasOvr: Record<string, bigint> = {};
      if (publicClient) {
        try {
          const feeData = await publicClient.estimateFeesPerGas();
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            gasOvr = { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas };
          } else {
            const gp = await publicClient.getGasPrice();
            if (gp > 0n) gasOvr = { gasPrice: gp } as any;
          }
        } catch {}
      }

      let txHash: Address;

      if (isNativePair) {
        const token = isNativeA ? tokenB : tokenA;
        const amountToken = isNativeA ? amountBWei : amountAWei;
        const amountTokenMin = isNativeA ? amountBMin : amountAMin;
        const amountETH = isNativeA ? amountAWei : amountBWei;
        const amountETHMin = isNativeA ? amountAMin : amountBMin;

        const txArgs = {
          address: contracts.router as Address,
          abi: ROUTER_ABI,
          functionName: 'addLiquidityETH' as const,
          args: [
            token as Address,
            fee,
            amountToken,
            amountTokenMin,
            amountETHMin,
            account,
            deadlineTimestamp,
          ],
          value: amountETH,
          ...gasOvr,
        };

        let gasEstimate: bigint | undefined;
        if (publicClient) {
          try {
            gasEstimate = await publicClient.estimateContractGas({
              ...txArgs,
              account: account as Address,
            } as any);
          } catch {}
        }

        txHash = await writeContractAsync({
          ...txArgs,
          ...(gasEstimate ? { gas: gasEstimate * 150n / 100n } : {}),
        } as any);
      } else {
        const txArgs = {
          address: contracts.router as Address,
          abi: ROUTER_ABI,
          functionName: 'addLiquidity' as const,
          args: [
            tokenA as Address,
            tokenB as Address,
            fee,
            amountAWei,
            amountBWei,
            amountAMin,
            amountBMin,
            account,
            deadlineTimestamp,
          ],
          ...gasOvr,
        };

        let gasEstimate: bigint | undefined;
        if (publicClient) {
          try {
            gasEstimate = await publicClient.estimateContractGas({
              ...txArgs,
              account: account as Address,
            } as any);
          } catch {}
        }

        txHash = await writeContractAsync({
          ...txArgs,
          ...(gasEstimate ? { gas: gasEstimate * 150n / 100n } : {}),
        } as any);
      }

      return txHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Add liquidity failed');
      setTxError(error);
      throw error;
    }
  }, [
    account, tokenA, tokenB, fee, amountA, amountB,
    decimalsA, decimalsB, deadline, slippage, isNativePair, isNativeA, writeContractAsync, contracts.router, publicClient,
  ]);

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
