'use client';

import { useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Address, parseEther } from 'viem';
import { useChain } from '@/hooks/useChain';
import { api } from '@/lib/api';
import { LAUNCHPAD_ABI } from '@/config/contracts';
import { useGasOverrides } from '@/hooks/useGasPrice';
import { formatUnits } from 'viem';

export interface LaunchpadSale {
  id: string;
  sale_id_onchain: number;
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_decimals: number;
  owner: string;
  price: string;
  price_usd: number;
  soft_cap: string;
  hard_cap: string;
  max_per_wallet: string;
  total_raised: string;
  total_raised_usd: number;
  participants: number;
  start_time: number;
  end_time: number;
  finalized: boolean;
  cancelled: boolean;
  liquidity_pct: number;
  lock_duration: number;
  status: 'active' | 'upcoming' | 'ended';
  sale_name: string;
  description: string;
  logo_url: string;
  website_url: string;
  social_url: string;
  tokens_for_sale: string;
  tokens_for_liquidity: string;
}

function toUnixSeconds(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  const ts = new Date(val.replace(' ', 'T') + 'Z').getTime() / 1000;
  return isNaN(ts) ? 0 : Math.floor(ts);
}

function weiToEth(val: string | undefined): string {
  if (!val || val === '0') return '0';
  try {
    return formatUnits(BigInt(val), 18);
  } catch {
    return '0';
  }
}

function transformSale(raw: any): LaunchpadSale {
  return {
    id: String(raw.id ?? '0'),
    sale_id_onchain: raw.sale_id_onchain ?? 0,
    token_address: raw.token_address ?? '',
    token_name: raw.token_name || raw.sale_name || raw.token_symbol || '',
    token_symbol: raw.token_symbol || '',
    token_decimals: raw.token_decimals ?? 18,
    owner: raw.creator_address ?? '',
    price: (() => {
      const hc = parseFloat(weiToEth(raw.hard_cap));
      const tfs = parseFloat(weiToEth(raw.tokens_for_sale));
      return tfs > 0 ? (hc / tfs).toString() : '0';
    })(),
    price_usd: raw.price_usd ?? 0,
    soft_cap: weiToEth(raw.soft_cap),
    hard_cap: weiToEth(raw.hard_cap),
    max_per_wallet: raw.max_per_wallet ?? '0',
    total_raised: weiToEth(raw.total_raised),
    total_raised_usd: raw.total_raised_usd ?? 0,
    participants: raw.participant_count ?? raw.participants ?? 0,
    start_time: toUnixSeconds(raw.start_time),
    end_time: toUnixSeconds(raw.end_time),
    finalized: raw.status === 'finalized' || raw.finalized === true,
    cancelled: raw.status === 'cancelled' || raw.cancelled === true,
    liquidity_pct: (raw.liquidity_pct ?? 0) > 100 ? Math.round((raw.liquidity_pct ?? 0) / 100) : (raw.liquidity_pct ?? 0),
    lock_duration: raw.liquidity_lock_days ?? raw.lock_duration ?? 0,
    status: raw.status === 'pending' ? 'upcoming' : (raw.status === 'active' ? 'active' : 'ended'),
    sale_name: raw.sale_name || '',
    description: raw.description || '',
    logo_url: raw.logo_url || '',
    website_url: raw.website_url || '',
    social_url: raw.social_url || '',
    tokens_for_sale: weiToEth(raw.tokens_for_sale),
    tokens_for_liquidity: weiToEth(raw.tokens_for_liquidity),
  };
}

export interface UserContribution {
  contributed: string;
  contributed_usd: number;
  claimed: boolean;
  claimable_tokens: string;
}

export function useLaunchpadSales(status?: string) {
  const { chainId } = useChain();

  const {
    data: salesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['launchpad-sales', chainId, status],
    queryFn: () => api.getLaunchpadSales(chainId, status),
    refetchInterval: 30_000,
  });

  const sales: LaunchpadSale[] = (salesData?.sales ?? []).map(transformSale);

  return { sales, isLoading, error };
}

export function useLaunchpadSale(id: string) {
  const { address } = useAccount();
  const { chainId, contracts } = useChain();
  const queryClient = useQueryClient();

  const {
    data: saleData,
    isLoading: isLoadingSale,
    error: saleError,
  } = useQuery({
    queryKey: ['launchpad-sale', id, chainId],
    queryFn: () => api.getLaunchpadSale(id, chainId),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  const {
    data: contribData,
    isLoading: isLoadingContrib,
    error: contribError,
  } = useQuery({
    queryKey: ['launchpad-contrib', id, address, chainId],
    queryFn: () => api.getLaunchpadUserContrib(id, address!, chainId),
    enabled: !!id && !!address,
    refetchInterval: 15_000,
  });

  const {
    writeContractAsync: writeContribute,
    data: contributeHash,
    isPending: isContributing,
    reset: resetContribute,
  } = useWriteContract();

  const { isLoading: isContributeConfirming, isSuccess: isContributeSuccess } = useWaitForTransactionReceipt({
    hash: contributeHash,
  });

  const {
    writeContractAsync: writeClaim,
    data: claimHash,
    isPending: isClaimingTokens,
    reset: resetClaim,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const {
    writeContractAsync: writeRefund,
    data: refundHash,
    isPending: isRefunding,
    reset: resetRefund,
  } = useWriteContract();

  const { isLoading: isRefundConfirming, isSuccess: isRefundSuccess } = useWaitForTransactionReceipt({
    hash: refundHash,
  });

  const { getGasOverrides } = useGasOverrides();
  const sale: LaunchpadSale | undefined = saleData?.sale ? transformSale(saleData.sale) : undefined;
  const onchainId = sale?.sale_id_onchain ?? 0;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['launchpad-sale', id] });
    queryClient.invalidateQueries({ queryKey: ['launchpad-contrib', id] });
    queryClient.invalidateQueries({ queryKey: ['launchpad-sales'] });
  }, [queryClient, id]);

  const contribute = useCallback(
    async (amountEth: string) => {
      if (!contracts.launchpad) return;
      const saleId = BigInt(onchainId);
      const value = parseEther(amountEth);
      const gas = await getGasOverrides();
      const hash = await writeContribute({
        address: contracts.launchpad as Address,
        abi: LAUNCHPAD_ABI,
        functionName: 'contribute',
        args: [saleId],
        value,
        ...gas,
      });
      return hash;
    },
    [contracts.launchpad, onchainId, writeContribute, getGasOverrides]
  );

  const claimTokens = useCallback(async () => {
    if (!contracts.launchpad) return;
    const saleId = BigInt(onchainId);
    const gas = await getGasOverrides();
    const hash = await writeClaim({
      address: contracts.launchpad as Address,
      abi: LAUNCHPAD_ABI,
      functionName: 'claimTokens',
      args: [saleId],
      ...gas,
    });
    return hash;
  }, [contracts.launchpad, onchainId, writeClaim, getGasOverrides]);

  const refund = useCallback(async () => {
    if (!contracts.launchpad) return;
    const saleId = BigInt(onchainId);
    const gas = await getGasOverrides();
    const hash = await writeRefund({
      address: contracts.launchpad as Address,
      abi: LAUNCHPAD_ABI,
      functionName: 'refund',
      args: [saleId],
      ...gas,
    });
    return hash;
  }, [contracts.launchpad, onchainId, writeRefund, getGasOverrides]);

  const contribution: UserContribution | undefined = contribData?.contribution;

  return {
    sale,
    contribution,
    isLoadingSale,
    isLoadingContrib,
    saleError,
    contribError,
    contribute,
    claimTokens,
    refund,
    invalidateAll,
    isContributing: isContributing || isContributeConfirming,
    isContributeSuccess,
    isClaimingTokens: isClaimingTokens || isClaimConfirming,
    isClaimSuccess,
    isRefunding: isRefunding || isRefundConfirming,
    isRefundSuccess,
    contributeHash,
    claimHash,
    refundHash,
    resetContribute,
    resetClaim,
    resetRefund,
    contracts,
  };
}
