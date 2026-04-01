'use client';

import { useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Address, parseUnits } from 'viem';
import { useChain } from '@/hooks/useChain';
import { api } from '@/lib/api';
import { STAKING_FACTORY_ABI, ERC20_ABI } from '@/config/contracts';
import { useGasOverrides } from '@/hooks/useGasPrice';

export function useCreateStakingPool() {
  const { address: wallet } = useAccount();
  const { chainId, contracts } = useChain();
  const queryClient = useQueryClient();

  const factoryAddress = contracts.stakingFactory;

  const { data: feeData, isLoading: isLoadingFee } = useQuery({
    queryKey: ['staking-create-fee', chainId],
    queryFn: () => api.getStakingCreateFee(chainId),
    staleTime: 60_000,
  });

  const feeRaw = feeData?.fee as any;
  const creationFee: string = (typeof feeRaw === 'string' ? feeRaw : feeRaw?.create_pool_fee_eth) ?? '0';
  const platformFeeBps: number = (typeof feeRaw === 'string' ? (feeData?.fee_bps ?? 0) : (feeRaw?.platform_reward_fee_bps ?? 0)) as number;

  const {
    writeContractAsync: writeApproveReward,
    data: approveRewardHash,
    isPending: isApproveRewardPending,
    reset: resetApproveReward,
  } = useWriteContract();

  const { isLoading: isApproveRewardConfirming, isSuccess: isApproveRewardSuccess } = useWaitForTransactionReceipt({
    hash: approveRewardHash,
  });

  const {
    writeContractAsync: writeCreatePool,
    data: createPoolHash,
    isPending: isCreatePoolPending,
    reset: resetCreatePool,
  } = useWriteContract();

  const { isLoading: isCreatePoolConfirming, isSuccess: isCreatePoolSuccess } = useWaitForTransactionReceipt({
    hash: createPoolHash,
  });

  const { getGasOverrides } = useGasOverrides();

  const approveRewardToken = useCallback(
    async (rewardTokenAddress: string, amount: bigint) => {
      if (!factoryAddress) return;
      const gas = await getGasOverrides();
      return writeApproveReward({
        address: rewardTokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress as Address, amount],
        ...gas,
      });
    },
    [factoryAddress, writeApproveReward, getGasOverrides]
  );

  const createPool = useCallback(
    async (
      stakeTokenAddress: string,
      rewardTokenAddress: string,
      rewardAmount: string,
      rewardTokenDecimals: number,
      durationDays: number,
      minStake: bigint = 0n,
      maxStakePerUser: bigint = 0n
    ) => {
      if (!factoryAddress) return;
      const parsedReward = parseUnits(rewardAmount, rewardTokenDecimals);
      const feeValue = BigInt(creationFee);
      const gas = await getGasOverrides();

      return writeCreatePool({
        address: factoryAddress as Address,
        abi: STAKING_FACTORY_ABI,
        functionName: 'createPool',
        args: [stakeTokenAddress as Address, rewardTokenAddress as Address, parsedReward, BigInt(durationDays), minStake, maxStakePerUser],
        value: feeValue,
        ...gas,
      });
    },
    [factoryAddress, creationFee, writeCreatePool, getGasOverrides]
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['staking-pools'] });
  }, [queryClient]);

  return {
    factoryAddress,
    creationFee,
    platformFeeBps,
    isLoadingFee,
    approveRewardToken,
    createPool,
    invalidateAll,
    isApproving: isApproveRewardPending || isApproveRewardConfirming,
    isApproveSuccess: isApproveRewardSuccess,
    isCreating: isCreatePoolPending || isCreatePoolConfirming,
    isCreateSuccess: isCreatePoolSuccess,
    approveRewardHash,
    createPoolHash,
    resetApproveReward,
    resetCreatePool,
  };
}
