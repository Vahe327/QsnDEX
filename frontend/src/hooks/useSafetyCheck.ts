'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChain } from './useChain';
import { getLocale } from '@/i18n';

export function useSafetyCheck(tokenAddress: string | undefined) {
  const { chainId } = useChain();
  const locale = getLocale();

  return useQuery({
    queryKey: ['safety', chainId, tokenAddress, locale],
    queryFn: () => api.checkSafety(tokenAddress!, chainId, locale),
    enabled: !!tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    select: (data) => data.safety,
  });
}
