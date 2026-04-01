'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChain } from './useChain';

export function useILCalculator(
  pool: string | undefined,
  depositUsd: number,
  priceChangePct: number,
  daysInPool: number
) {
  const { chainId } = useChain();

  const isValid =
    !!pool &&
    pool.startsWith('0x') &&
    pool.length === 42 &&
    depositUsd > 0 &&
    daysInPool > 0;

  return useQuery({
    queryKey: ['il-simulate', chainId, pool, depositUsd, priceChangePct, daysInPool],
    queryFn: () =>
      api.simulateIL({
        pool: pool!,
        deposit_usd: depositUsd,
        price_change_pct: priceChangePct,
        days_in_pool: daysInPool,
        chain_id: chainId,
      }),
    enabled: isValid,
    staleTime: 60 * 1000,
    retry: 1,
    select: (data) => data.simulation,
  });
}
