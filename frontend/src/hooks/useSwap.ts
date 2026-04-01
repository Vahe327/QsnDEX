'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { type Address, parseUnits, formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { ROUTER_ABI } from '@/config/contracts';
import { NATIVE_ETH } from '@/config/tokens';
import { useSettingsStore } from '@/store/settingsStore';
import { api } from '@/lib/api';
import { useChain } from './useChain';

interface SwapQuoteRaw {
  amount_out: string;
  amount_in: string;
  min_received: string;
  price_impact: number;
  path: string[];
  fees: number[];
  fee_amount: string;
  route_description: string;
}

interface SwapQuote {
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  route: string[];
  fees: number[];
  gasEstimate?: string;
}

interface UseSwapParams {
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  tokenInDecimals?: number;
  tokenOutDecimals?: number;
}

export function useSwap({
  tokenIn,
  tokenOut,
  amountIn,
  tokenInDecimals = 18,
  tokenOutDecimals = 18,
}: UseSwapParams) {
  const { address: account } = useAccount();
  const { chainId, contracts } = useChain();
  const publicClient = usePublicClient({ chainId });
  const slippage = useSettingsStore((s) => s.slippage);
  const deadline = useSettingsStore((s) => s.deadline);

  const [txError, setTxError] = useState<Error | null>(null);

  const isNativeIn = tokenIn === NATIVE_ETH.address;
  const isNativeOut = tokenOut === NATIVE_ETH.address;

  const hasValidInput =
    !!tokenIn && !!tokenOut && !!amountIn && parseFloat(amountIn) > 0 && tokenIn !== tokenOut;

  const {
    data: quoteData,
    isLoading: isQuoteLoading,
    error: quoteError,
    refetch: refetchQuote,
  } = useQuery({
    queryKey: ['swapQuote', chainId, tokenIn, tokenOut, amountIn, slippage],
    queryFn: async () => {
      const amountInWei = parseUnits(amountIn!, tokenInDecimals).toString();
      const { quote } = await api.getSwapQuote(tokenIn!, tokenOut!, amountInWei, slippage, chainId);
      const raw = quote as SwapQuoteRaw;
      const amountOutWei = raw.amount_out.split('.')[0];
      const minReceivedWei = raw.min_received.split('.')[0];
      const amountOutFormatted = formatUnits(BigInt(amountOutWei || '0'), tokenOutDecimals);
      return {
        amountOut: amountOutFormatted,
        amountOutMin: minReceivedWei,
        priceImpact: raw.price_impact,
        route: raw.path,
        fees: raw.fees,
      } as SwapQuote;
    },
    enabled: hasValidInput,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const { writeContractAsync, data: hash, isPending, reset: resetWrite } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const execute = useCallback(async () => {
    if (!account || !quoteData || !tokenIn || !tokenOut || !amountIn) {
      throw new Error('Missing swap parameters');
    }

    setTxError(null);

    try {
      const amountInWei = parseUnits(amountIn, tokenInDecimals);
      let amountOutMin: bigint;
      let path: Address[];
      let fees: number[];

      try {
        const freshAmountInWei = amountInWei.toString();
        const { quote: freshQuote } = await api.getSwapQuote(tokenIn, tokenOut, freshAmountInWei, slippage, chainId);
        const freshRaw = freshQuote as SwapQuoteRaw;
        const freshMinWei = freshRaw.min_received.split('.')[0];
        amountOutMin = BigInt(freshMinWei || '0');
        path = freshRaw.path.map((a: string) => a as Address);
        fees = freshRaw.fees;
      } catch {
        amountOutMin = BigInt(quoteData.amountOutMin);
        path = quoteData.route.map((a: string) => a as Address);
        fees = quoteData.fees;
      }

      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadline * 60);

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

      if (isNativeIn) {
        txHash = await writeContractAsync({
          address: contracts.router as Address,
          abi: ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [amountOutMin, path, fees, account, deadlineTimestamp],
          value: amountInWei,
          ...gasOvr,
        } as any);
      } else if (isNativeOut) {
        txHash = await writeContractAsync({
          address: contracts.router as Address,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForETH',
          args: [amountInWei, amountOutMin, path, fees, account, deadlineTimestamp],
          ...gasOvr,
        } as any);
      } else {
        txHash = await writeContractAsync({
          address: contracts.router as Address,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountInWei, amountOutMin, path, fees, account, deadlineTimestamp],
          ...gasOvr,
        } as any);
      }

      return txHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Swap failed');
      setTxError(error);
      throw error;
    }
  }, [
    account, quoteData, tokenIn, tokenOut, amountIn,
    tokenInDecimals, deadline, isNativeIn, isNativeOut, writeContractAsync, contracts.router,
    slippage, chainId,
  ]);

  return {
    quote: quoteData ?? null,
    isQuoteLoading,
    quoteError,
    refetchQuote,
    execute,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    isLoading: isPending || isConfirming,
    error: txError || quoteError,
    resetWrite,
    route: quoteData?.route ?? [],
    priceImpact: quoteData?.priceImpact ?? 0,
    amountOut: quoteData?.amountOut ?? '0',
  };
}
