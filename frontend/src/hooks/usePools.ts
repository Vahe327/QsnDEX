'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChain } from './useChain';

type SortField = 'tvl' | 'volume24h' | 'apr' | 'fee';
type SortOrder = 'asc' | 'desc';

interface UsePoolsParams {
  limit?: number;
  initialSort?: SortField;
  initialOrder?: SortOrder;
}

export function usePools({ limit = 50, initialSort = 'tvl', initialOrder = 'desc' }: UsePoolsParams = {}) {
  const { chainId } = useChain();
  const [sortField, setSortField] = useState<SortField>(initialSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pools', chainId, sortField, sortOrder, limit, page],
    queryFn: () =>
      api.getPools({
        sort: sortField,
        order: sortOrder,
        limit,
        offset: page * limit,
        chainId,
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const pools = data?.pools ?? [];
  const total = data?.total ?? 0;

  const filteredPools = useMemo(() => {
    if (!searchQuery.trim()) return pools;
    const q = searchQuery.toLowerCase();
    return pools.filter(
      (pool: any) =>
        pool.token0_symbol?.toLowerCase().includes(q) ||
        pool.token1_symbol?.toLowerCase().includes(q) ||
        pool.address?.toLowerCase().includes(q) ||
        pool.name?.toLowerCase().includes(q)
    );
  }, [pools, searchQuery]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(0);
  }

  return {
    pools: filteredPools,
    allPools: pools,
    total,
    isLoading,
    isError,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    page,
    setPage,
    totalPages: Math.ceil(total / limit),
  };
}

export function usePool(address?: string) {
  const { chainId } = useChain();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pool', chainId, address],
    queryFn: () => api.getPool(address!, chainId),
    enabled: !!address,
    staleTime: 15_000,
  });

  return {
    pool: data?.pool ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function usePoolChart(address?: string, period = '7d') {
  const { chainId } = useChain();

  const { data, isLoading, error } = useQuery({
    queryKey: ['poolChart', chainId, address, period],
    queryFn: () => api.getPoolChart(address!, period, chainId),
    enabled: !!address,
    staleTime: 60_000,
  });

  return {
    chart: data?.chart ?? [],
    isLoading,
    error,
  };
}
