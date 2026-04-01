'use client';

import { useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Address, parseUnits } from 'viem';
import { useChain } from '@/hooks/useChain';
import { api } from '@/lib/api';
import { STAKING_POOL_ABI, ERC20_ABI } from '@/config/contracts';
import { useGasOverrides } from '@/hooks/useGasPrice';
import { formatUnits } from 'viem';

export interface StakingPoolInfo {
  address: string;
  stake_token: string;
  stake_token_symbol: string;
  stake_token_decimals: number;
  reward_token: string;
  reward_token_symbol: string;
  reward_token_decimals: number;
  total_staked: string;
  total_staked_usd: number;
  apr: number;
  stakers_count: number;
  remaining_rewards: string;
  remaining_rewards_usd: number;
  period_finish: number;
  reward_rate: string;
  creator: string;
  is_protocol: boolean;
}

export interface StakingPoolUserInfo {
  staked_amount: string;
  staked_usd: number;
  pending_rewards: string;
  pending_rewards_usd: number;
  stake_since: number;
}

export function useStakingPools(status?: string, sort?: string) {
  const { chainId } = useChain();

  const {
    data: poolsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['staking-pools', chainId, status, sort],
    queryFn: () => api.getStakingPools(chainId, status, sort),
    refetchInterval: 30_000,
  });

  const pools: StakingPoolInfo[] = (poolsData?.pools ?? []).map((p: any) => {
    const stakeDec = p.stake_token_decimals ?? 18;
    const rewardDec = p.reward_token_decimals ?? 18;
    const totalStakedHuman = (() => { try { const v = p.total_staked || '0'; return v.includes('.') ? parseFloat(v) : parseFloat(formatUnits(BigInt(v), stakeDec)); } catch { return 0; } })();
    const remainingHuman = (() => { try { const v = p.remaining_rewards || '0'; return v.includes('.') ? parseFloat(v) : parseFloat(formatUnits(BigInt(v), rewardDec)); } catch { return 0; } })();
    return {
      address: p.pool_address || p.address || '',
      stake_token: p.stake_token || '',
      stake_token_symbol: p.stake_token_symbol || '',
      stake_token_decimals: stakeDec,
      reward_token: p.reward_token || '',
      reward_token_symbol: p.reward_token_symbol || '',
      reward_token_decimals: rewardDec,
      total_staked: totalStakedHuman.toString(),
      total_staked_usd: p.total_staked_usd ?? totalStakedHuman,
      apr: p.apr ?? 0,
      stakers_count: p.staker_count ?? p.stakers_count ?? 0,
      remaining_rewards: remainingHuman.toString(),
      remaining_rewards_usd: p.remaining_rewards_usd ?? remainingHuman,
      period_finish: typeof p.period_finish === 'number' ? p.period_finish : (p.period_finish ? Math.floor(new Date(p.period_finish.replace(' ', 'T') + 'Z').getTime() / 1000) : 0),
      reward_rate: p.reward_rate || '0',
      creator: p.creator || '',
      is_protocol: p.is_protocol ?? false,
    };
  });

  return { pools, isLoading, error };
}

export function useStakingPool(poolAddress?: string) {
  const { chainId } = useChain();
  const { address: wallet } = useAccount();

  const {
    data: poolData,
    isLoading: isLoadingPool,
    error: poolError,
  } = useQuery({
    queryKey: ['staking-pool', poolAddress, chainId],
    queryFn: () => api.getStakingPool(poolAddress!, chainId),
    enabled: !!poolAddress,
    refetchInterval: 20_000,
  });

  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['staking-pool-user', poolAddress, wallet, chainId],
    queryFn: () => api.getStakingPoolUser(poolAddress!, wallet!, chainId),
    enabled: !!poolAddress && !!wallet,
    refetchInterval: 15_000,
  });

  const rawPool = poolData?.pool;
  const pool: StakingPoolInfo | undefined = rawPool ? (() => {
    const stakeDec = rawPool.stake_token_decimals ?? 18;
    const rewardDec = rawPool.reward_token_decimals ?? 18;
    const totalStakedHuman = (() => { try { const v = rawPool.total_staked || '0'; return String(v).includes('.') ? parseFloat(v) : parseFloat(formatUnits(BigInt(v), stakeDec)); } catch { return 0; } })();
    const remainingHuman = (() => { try { const v = rawPool.remaining_rewards || '0'; return String(v).includes('.') ? parseFloat(v) : parseFloat(formatUnits(BigInt(v), rewardDec)); } catch { return 0; } })();
    return {
      address: rawPool.pool_address || rawPool.address || '',
      stake_token: rawPool.stake_token || '',
      stake_token_symbol: rawPool.stake_token_symbol || '',
      stake_token_decimals: stakeDec,
      reward_token: rawPool.reward_token || '',
      reward_token_symbol: rawPool.reward_token_symbol || '',
      reward_token_decimals: rewardDec,
      total_staked: totalStakedHuman.toString(),
      total_staked_usd: rawPool.total_staked_usd ?? totalStakedHuman,
      apr: rawPool.apr ?? 0,
      stakers_count: rawPool.staker_count ?? rawPool.stakers_count ?? 0,
      remaining_rewards: remainingHuman.toString(),
      remaining_rewards_usd: rawPool.remaining_rewards_usd ?? remainingHuman,
      period_finish: typeof rawPool.period_finish === 'number' ? rawPool.period_finish : (rawPool.period_finish ? Math.floor(new Date(rawPool.period_finish.replace(' ', 'T') + 'Z').getTime() / 1000) : 0),
      reward_rate: rawPool.reward_rate || '0',
      creator: rawPool.creator || '',
      is_protocol: rawPool.is_protocol ?? false,
    };
  })() : undefined;
  const rawUser = (userData as any)?.position || (userData as any)?.user;
  const userInfo: StakingPoolUserInfo | undefined = rawUser ? {
    staked_amount: rawUser.staked_balance_formatted || rawUser.staked_amount || '0',
    staked_usd: rawUser.staked_usd ?? 0,
    pending_rewards: rawUser.pending_reward_formatted || rawUser.pending_rewards || '0',
    pending_rewards_usd: rawUser.pending_rewards_usd ?? 0,
    stake_since: rawUser.stake_since ?? 0,
  } : undefined;

  return { pool, userInfo, isLoadingPool, isLoadingUser, poolError, userError };
}

export function useUserStakingPositions() {
  const { chainId } = useChain();
  const { address: wallet } = useAccount();

  const { pools: allPools } = useStakingPools();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-staking-positions', wallet, chainId],
    queryFn: () => api.getUserStakingPositions(wallet!, chainId),
    enabled: !!wallet,
    refetchInterval: 30_000,
  });

  const positions: StakingPoolInfo[] = (data?.positions ?? []).map((pos: any) => {
    const poolAddr = (pos.pool_address || '').toLowerCase();
    const pool = allPools.find(p => p.address.toLowerCase() === poolAddr);
    if (pool) return pool;
    return {
      address: pos.pool_address || '',
      stake_token: pos.stake_token || '',
      stake_token_symbol: pos.stake_token_symbol || '',
      stake_token_decimals: 18,
      reward_token: pos.reward_token || '',
      reward_token_symbol: pos.reward_token_symbol || '',
      reward_token_decimals: 18,
      total_staked: '0',
      total_staked_usd: 0,
      apr: 0,
      stakers_count: 0,
      remaining_rewards: '0',
      remaining_rewards_usd: 0,
      period_finish: 0,
      reward_rate: '0',
      creator: '',
      is_protocol: false,
    };
  });

  return { positions, isLoading, error };
}

export function useStakingPoolActions(poolAddress?: string, stakeTokenAddress?: string, stakeTokenDecimals?: number) {
  const { address: wallet } = useAccount();
  const queryClient = useQueryClient();

  const {
    writeContractAsync: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    writeContractAsync: writeStake,
    data: stakeHash,
    isPending: isStakePending,
    reset: resetStake,
  } = useWriteContract();

  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  const {
    writeContractAsync: writeUnstake,
    data: unstakeHash,
    isPending: isUnstakePending,
    reset: resetUnstake,
  } = useWriteContract();

  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  const {
    writeContractAsync: writeClaim,
    data: claimHash,
    isPending: isClaimPending,
    reset: resetClaim,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const {
    writeContractAsync: writeExit,
    data: exitHash,
    isPending: isExitPending,
    reset: resetExit,
  } = useWriteContract();

  const { isLoading: isExitConfirming, isSuccess: isExitSuccess } = useWaitForTransactionReceipt({
    hash: exitHash,
  });

  const { getGasOverrides } = useGasOverrides();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['staking-pools'] });
    queryClient.invalidateQueries({ queryKey: ['staking-pool'] });
    queryClient.invalidateQueries({ queryKey: ['staking-pool-user'] });
    queryClient.invalidateQueries({ queryKey: ['user-staking-positions'] });
  }, [queryClient]);

  const approveStakeToken = useCallback(
    async (amount: bigint) => {
      if (!stakeTokenAddress || !poolAddress) return;
      const gas = await getGasOverrides();
      return writeApprove({
        address: stakeTokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress as Address, amount],
        ...gas,
      });
    },
    [stakeTokenAddress, poolAddress, writeApprove, getGasOverrides]
  );

  const stake = useCallback(
    async (amount: string) => {
      if (!poolAddress) return;
      const decimals = stakeTokenDecimals ?? 18;
      const parsedAmount = parseUnits(amount, decimals);
      const gas = await getGasOverrides();
      return writeStake({
        address: poolAddress as Address,
        abi: STAKING_POOL_ABI,
        functionName: 'stake',
        args: [parsedAmount],
        ...gas,
      });
    },
    [poolAddress, stakeTokenDecimals, writeStake, getGasOverrides]
  );

  const unstake = useCallback(
    async (amount: string) => {
      if (!poolAddress) return;
      const decimals = stakeTokenDecimals ?? 18;
      const parsedAmount = parseUnits(amount, decimals);
      const gas = await getGasOverrides();
      return writeUnstake({
        address: poolAddress as Address,
        abi: STAKING_POOL_ABI,
        functionName: 'withdraw',
        args: [parsedAmount],
        ...gas,
      });
    },
    [poolAddress, stakeTokenDecimals, writeUnstake, getGasOverrides]
  );

  const claim = useCallback(async () => {
    if (!poolAddress) return;
    const gas = await getGasOverrides();
    return writeClaim({
      address: poolAddress as Address,
      abi: STAKING_POOL_ABI,
      functionName: 'claimReward',
      args: [],
      ...gas,
    });
  }, [poolAddress, writeClaim, getGasOverrides]);

  const exit = useCallback(async () => {
    if (!poolAddress) return;
    const gas = await getGasOverrides();
    return writeExit({
      address: poolAddress as Address,
      abi: STAKING_POOL_ABI,
      functionName: 'exit',
      args: [],
      ...gas,
    });
  }, [poolAddress, writeExit, getGasOverrides]);

  return {
    approveStakeToken,
    stake,
    unstake,
    claim,
    exit,
    invalidateAll,
    isApproving: isApprovePending || isApproveConfirming,
    isApproveSuccess,
    isStaking: isStakePending || isStakeConfirming,
    isStakeSuccess,
    isUnstaking: isUnstakePending || isUnstakeConfirming,
    isUnstakeSuccess,
    isClaiming: isClaimPending || isClaimConfirming,
    isClaimSuccess,
    isExiting: isExitPending || isExitConfirming,
    isExitSuccess,
    stakeHash,
    unstakeHash,
    claimHash,
    exitHash,
    approveHash,
    resetApprove,
    resetStake,
    resetUnstake,
    resetClaim,
    resetExit,
  };
}
