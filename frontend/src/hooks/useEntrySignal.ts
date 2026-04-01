'use client';

import { useQuery } from '@tanstack/react-query';
import { api, type EntrySignalResponse } from '@/lib/api';
import { useChain } from './useChain';
import { getLocale } from '@/i18n';

export function useEntrySignal(tokenAddress: string | undefined) {
  const { chainId } = useChain();
  const locale = getLocale();

  return useQuery({
    queryKey: ['entry-signal', chainId, tokenAddress, locale],
    queryFn: async (): Promise<EntrySignalResponse> => {
      const res = await api.getEntrySignal(tokenAddress!, chainId, locale);
      return res.signal;
    },
    enabled: !!tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
