'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getLocale } from '@/i18n';
import { useChain } from './useChain';

export function useAutopilot(walletAddress: string | undefined) {
  const { chainId } = useChain();
  const locale = getLocale();

  return useQuery({
    queryKey: ['autopilot', chainId, walletAddress, locale],
    queryFn: () => api.getAutopilot(walletAddress!, locale, chainId),
    enabled: !!walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42,
    staleTime: 3 * 60 * 1000,
    retry: 1,
    select: (data) => data.autopilot,
  });
}
