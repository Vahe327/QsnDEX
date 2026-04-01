'use client';

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, createPriceWebSocket } from '@/lib/api';
import { useChain } from './useChain';

export function usePrices(tokenAddresses: string[]) {
  const { chainId } = useChain();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sortedAddresses = useMemo(
    () => [...tokenAddresses].filter(Boolean).sort(),
    [tokenAddresses]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['prices', chainId, sortedAddresses],
    queryFn: () => api.getPrices(sortedAddresses, chainId),
    enabled: sortedAddresses.length > 0,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const prices: Record<string, number> = data?.prices ?? {};

  const connectWs = useCallback(() => {
    if (sortedAddresses.length === 0) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = createPriceWebSocket((msg: any) => {
        if (msg && typeof msg === 'object' && msg.prices) {
          queryClient.setQueryData(['prices', chainId, sortedAddresses], (prev: any) => {
            const merged = { ...(prev?.prices ?? {}), ...msg.prices };
            return { prices: merged };
          });
        }
        if (msg && msg.token && msg.price != null) {
          queryClient.setQueryData(['prices', chainId, sortedAddresses], (prev: any) => {
            const merged = { ...(prev?.prices ?? {}), [msg.token]: msg.price };
            return { prices: merged };
          });
        }
      });

      ws.onopen = () => {};
      ws.onclose = () => {
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connectWs, 5000);
      };
      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      reconnectTimeoutRef.current = setTimeout(connectWs, 5000);
    }
  }, [sortedAddresses, queryClient, chainId]);

  useEffect(() => {
    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connectWs]);

  function getPrice(address: string): number {
    return prices[address.toLowerCase()] ?? prices[address] ?? 0;
  }

  function getUsdValue(address: string, amount: number): number {
    return getPrice(address) * amount;
  }

  return {
    prices,
    getPrice,
    getUsdValue,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useTokenPrice(tokenAddress?: string) {
  const { chainId } = useChain();

  const { data, isLoading, error } = useQuery({
    queryKey: ['price', chainId, tokenAddress],
    queryFn: () => api.getPrices([tokenAddress!], chainId),
    enabled: !!tokenAddress,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const price = tokenAddress
    ? (data?.prices?.[tokenAddress.toLowerCase()] ?? data?.prices?.[tokenAddress] ?? 0)
    : 0;

  return { price, isLoading, error };
}
