'use client';

import { useReadContract, useAccount, useBalance } from 'wagmi';
import { type Address } from 'viem';
import { ERC20_ABI } from '@/config/contracts';
import { formatTokenAmount } from '@/lib/formatters';
import { NATIVE_ETH } from '@/config/tokens';

interface UseTokenBalanceParams {
  tokenAddress?: string;
  decimals?: number;
  watch?: boolean;
}

export function useTokenBalance({ tokenAddress, decimals = 18, watch = false }: UseTokenBalanceParams) {
  const { address: account } = useAccount();

  const isNative =
    !tokenAddress ||
    tokenAddress === NATIVE_ETH.address ||
    tokenAddress === '0x0000000000000000000000000000000000000000';

  const nativeBalance = useBalance({
    address: account,
    query: {
      enabled: isNative && !!account,
      refetchInterval: watch ? 10_000 : false,
    },
  });

  const erc20Balance = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: {
      enabled: !isNative && !!account && !!tokenAddress,
      refetchInterval: watch ? 10_000 : false,
    },
  });

  if (isNative) {
    const raw = nativeBalance.data?.value ?? 0n;
    return {
      balance: raw,
      formatted: formatTokenAmount(raw, 18),
      isLoading: nativeBalance.isLoading,
      isError: nativeBalance.isError,
      error: nativeBalance.error,
      refetch: nativeBalance.refetch,
    };
  }

  const raw = (erc20Balance.data as bigint) ?? 0n;
  return {
    balance: raw,
    formatted: formatTokenAmount(raw, decimals),
    isLoading: erc20Balance.isLoading,
    isError: erc20Balance.isError,
    error: erc20Balance.error,
    refetch: erc20Balance.refetch,
  };
}
