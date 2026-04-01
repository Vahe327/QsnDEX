'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api, BatchQuoteRequest, BatchBuildTxRequest } from '@/lib/api';
import { useChain } from './useChain';

export function useBatchQuote(request: BatchQuoteRequest | undefined) {
  const { chainId } = useChain();

  const isValid =
    !!request &&
    !!request.token_in &&
    request.token_in.startsWith('0x') &&
    request.token_in.length === 42 &&
    !!request.amount_in &&
    request.amount_in !== '0' &&
    request.orders.length > 0 &&
    request.orders.every(
      (o) => !!o.token_out && o.token_out.startsWith('0x') && o.token_out.length === 42 && o.percentage > 0
    ) &&
    request.orders.reduce((sum, o) => sum + o.percentage, 0) === 100;

  const requestWithChain = request ? {
    ...request,
    chain_id: chainId,
    orders: request.orders.map(o => ({ ...o, percentage: o.percentage * 100 })),
  } : undefined;

  return useQuery({
    queryKey: ['batch-quote', chainId, request?.token_in, request?.amount_in, request?.orders, request?.slippage_bps],
    queryFn: () => api.getBatchQuote(requestWithChain!),
    enabled: isValid,
    staleTime: 15 * 1000,
    retry: 1,
    select: (data) => data.quote,
  });
}

export function useBatchBuildTx() {
  const { chainId } = useChain();

  return useMutation({
    mutationFn: (request: BatchBuildTxRequest) =>
      api.buildBatchTx({ ...request, chain_id: chainId }),
    retry: 0,
  });
}
