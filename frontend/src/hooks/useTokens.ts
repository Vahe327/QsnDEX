'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { NATIVE_ETH, type TokenInfo, getDefaultTokensForChain } from '@/config/tokens';
import { useChain } from './useChain';

export function useTokens() {
  const { chainId, tokens: chainDefaultTokens, nativeToken } = useChain();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading: isLoadingApi, error: apiError } = useQuery({
    queryKey: ['tokens', chainId],
    queryFn: () => api.getTokens(undefined, chainId),
    staleTime: 120_000,
  });

  const apiTokens: TokenInfo[] = data?.tokens ?? [];

  const defaultTokenList = chainDefaultTokens;

  const allTokens = useMemo(() => {
    const map = new Map<string, TokenInfo>();
    for (const token of defaultTokenList) {
      map.set(token.address.toLowerCase(), token);
    }
    for (const token of apiTokens) {
      map.set(token.address.toLowerCase(), token);
    }
    return Array.from(map.values());
  }, [apiTokens, defaultTokenList]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return allTokens;
    const q = searchQuery.toLowerCase();
    return allTokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [allTokens, searchQuery]);

  const searchApiTokens = useQuery({
    queryKey: ['tokenSearch', chainId, searchQuery],
    queryFn: () => api.getTokens(searchQuery, chainId),
    enabled: searchQuery.length > 2 && filteredTokens.length === 0,
    staleTime: 30_000,
  });

  const combinedResults = useMemo(() => {
    if (filteredTokens.length > 0) return filteredTokens;
    return searchApiTokens.data?.tokens ?? [];
  }, [filteredTokens, searchApiTokens.data]);

  const getToken = useCallback(
    (address: string): TokenInfo | undefined => {
      if (address === NATIVE_ETH.address) return nativeToken;
      return allTokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
    },
    [allTokens, nativeToken]
  );

  const importToken = useCallback(
    async (address: string) => {
      const result = await api.importToken(address, chainId);
      return result;
    },
    [chainId]
  );

  return {
    tokens: combinedResults,
    allTokens,
    nativeToken,
    defaultTokens: defaultTokenList,
    isLoading: isLoadingApi || searchApiTokens.isLoading,
    error: apiError,
    searchQuery,
    setSearchQuery,
    getToken,
    importToken,
  };
}
