'use client';

import { useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Address, parseEther } from 'viem';
import { useChain } from '@/hooks/useChain';
import { api } from '@/lib/api';
import { STAKE_VAULT_ABI, QSN_TOKEN_ABI } from '@/config/contracts';
import { useGasOverrides } from '@/hooks/useGasPrice';

export interface StakingInfo {
  qsn_price: number;
  total_staked: string;
  total_staked_usd: number;
  apy: number;
  total_distributed: string;
  total_distributed_usd: number;
  stakers_count: number;
  distribution_frequency: string;
  reward_token_symbol: string;
}

export interface StakingUser {
  staked_amount: string;
  staked_usd: number;
  share_pct: number;
  pending_rewards: string;
  pending_rewards_usd: number;
  total_claimed: string;
  total_claimed_usd: number;
  stake_since: number;
}

export function useQsnStaking() {
  const { address } = useAccount();
  const { chainId, contracts } = useChain();
  const queryClient = useQueryClient();

  const {
    data: stakingData,
    isLoading: isLoadingStaking,
    error: stakingError,
  } = useQuery({
    queryKey: ['staking-info', chainId],
    queryFn: () => api.getStakingInfo(chainId),
    refetchInterval: 30_000,
  });

  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['staking-user', address, chainId],
    queryFn: () => api.getStakingUser(address!, chainId),
    enabled: !!address,
    refetchInterval: 15_000,
  });

  const {
    data: qsnData,
    isLoading: isLoadingQsn,
  } = useQuery({
    queryKey: ['qsn-info', chainId],
    queryFn: () => api.getQsnInfo(chainId),
    refetchInterval: 60_000,
  });

  const {
    writeContractAsync: writeStake,
    data: stakeHash,
    isPending: isStaking,
    reset: resetStake,
  } = useWriteContract();

  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  const {
    writeContractAsync: writeUnstake,
    data: unstakeHash,
    isPending: isUnstaking,
    reset: resetUnstake,
  } = useWriteContract();

  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  const {
    writeContractAsync: writeClaim,
    data: claimHash,
    isPending: isClaiming,
    reset: resetClaim,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const {
    writeContractAsync: writeApprove,
    data: approveHash,
    isPending: isApproving,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { getGasOverrides } = useGasOverrides();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['staking-info'] });
    queryClient.invalidateQueries({ queryKey: ['staking-user'] });
    queryClient.invalidateQueries({ queryKey: ['qsn-info'] });
  }, [queryClient]);

  const approveQsn = useCallback(
    async (amount: bigint) => {
      if (!contracts.stakeVault || !contracts.qsnToken) return;
      const gas = await getGasOverrides();
      const hash = await writeApprove({
        address: contracts.qsnToken as Address,
        abi: QSN_TOKEN_ABI,
        functionName: 'approve',
        args: [contracts.stakeVault as Address, amount],
        ...gas,
      });
      return hash;
    },
    [contracts.stakeVault, contracts.qsnToken, writeApprove, getGasOverrides]
  );

  const stake = useCallback(
    async (amount: string) => {
      if (!contracts.stakeVault) return;
      const parsedAmount = parseEther(amount);
      const gas = await getGasOverrides();
      const hash = await writeStake({
        address: contracts.stakeVault as Address,
        abi: STAKE_VAULT_ABI,
        functionName: 'stake',
        args: [parsedAmount],
        ...gas,
      });
      return hash;
    },
    [contracts.stakeVault, writeStake, getGasOverrides]
  );

  const unstake = useCallback(
    async (amount: string) => {
      if (!contracts.stakeVault) return;
      const parsedAmount = parseEther(amount);
      const gas = await getGasOverrides();
      const hash = await writeUnstake({
        address: contracts.stakeVault as Address,
        abi: STAKE_VAULT_ABI,
        functionName: 'withdraw',
        args: [parsedAmount],
        ...gas,
      });
      return hash;
    },
    [contracts.stakeVault, writeUnstake, getGasOverrides]
  );

  const claim = useCallback(async () => {
    if (!contracts.stakeVault) return;
    const gas = await getGasOverrides();
    const hash = await writeClaim({
      address: contracts.stakeVault as Address,
      abi: STAKE_VAULT_ABI,
      functionName: 'claimReward',
      args: [],
      ...gas,
    });
    return hash;
  }, [contracts.stakeVault, writeClaim, getGasOverrides]);

  const stakingInfo: StakingInfo | undefined = stakingData?.staking;
  const userInfo: StakingUser | undefined = userData?.user;
  const qsnInfo = qsnData?.qsn;

  return {
    stakingInfo,
    userInfo,
    qsnInfo,
    isLoading: isLoadingStaking || isLoadingQsn,
    isLoadingUser,
    stakingError,
    userError,
    approveQsn,
    stake,
    unstake,
    claim,
    invalidateAll,
    isApproving: isApproving || isApproveConfirming,
    isApproveSuccess,
    isStaking: isStaking || isStakeConfirming,
    isStakeSuccess,
    isUnstaking: isUnstaking || isUnstakeConfirming,
    isUnstakeSuccess,
    isClaiming: isClaiming || isClaimConfirming,
    isClaimSuccess,
    stakeHash,
    unstakeHash,
    claimHash,
    approveHash,
    resetStake,
    resetUnstake,
    resetClaim,
    resetApprove,
    contracts,
  };
}
