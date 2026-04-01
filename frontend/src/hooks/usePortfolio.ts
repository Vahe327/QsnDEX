'use client';

import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChain } from './useChain';

export function usePortfolio() {
  const { address: account } = useAccount();
  const { chainId } = useChain();

  const {
    data: portfolioData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', chainId, account],
    queryFn: () => api.getPortfolio(account!, chainId),
    enabled: !!account,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['history', chainId, account],
    queryFn: () => api.getHistory(account!, chainId),
    enabled: !!account,
    staleTime: 30_000,
  });

  return {
    portfolio: portfolioData?.portfolio ?? null,
    swaps: historyData?.swaps ?? [],
    liquidityEvents: historyData?.liquidity_events ?? [],
    isLoading,
    isHistoryLoading,
    isError,
    error,
    historyError,
    refetch,
    refetchHistory,
    isConnected: !!account,
    walletAddress: account,
  };
}
