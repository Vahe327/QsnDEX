'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { type Address, maxUint256 } from 'viem';
import { ERC20_ABI } from '@/config/contracts';
import { useSettingsStore } from '@/store/settingsStore';
import { useChainStore } from '@/store/chainStore';

interface UseApproveParams {
  tokenAddress?: string;
  spenderAddress?: string;
  amount?: bigint;
}

export function useApprove({ tokenAddress, spenderAddress, amount = 0n }: UseApproveParams) {
  const { address: account } = useAccount();
  const selectedChainId = useChainStore((s) => s.selectedChainId);
  const publicClient = usePublicClient({ chainId: selectedChainId });
  const infiniteApproval = useSettingsStore((s) => s.infiniteApproval);

  const { data: currentAllowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: account && spenderAddress ? [account, spenderAddress as Address] : undefined,
    query: {
      enabled: !!account && !!tokenAddress && !!spenderAddress,
    },
  });

  const { writeContractAsync, data: hash, isPending: isApproving, error: approveError, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash,
  });

  const allowance = (currentAllowance as bigint) ?? 0n;
  const needsApproval = amount > 0n && allowance < amount;

  async function approve() {
    if (!tokenAddress || !spenderAddress) {
      throw new Error('Token address and spender address are required');
    }

    const approveAmount = infiniteApproval ? maxUint256 : amount;

    let gasOverrides: Record<string, bigint> = {};
    if (publicClient) {
      try {
        const feeData = await publicClient.estimateFeesPerGas();
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          gasOverrides = {
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          };
        } else {
          const gasPrice = await publicClient.getGasPrice();
          if (gasPrice > 0n) {
            gasOverrides = { gasPrice } as any;
          }
        }
      } catch {}
    }

    const txHash = await writeContractAsync({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress as Address, approveAmount],
      ...gasOverrides,
    } as any);

    return txHash;
  }

  return {
    allowance,
    needsApproval,
    approve,
    isLoadingAllowance,
    isApproving: isApproving || isConfirming,
    isApproved,
    approveError,
    refetchAllowance,
    reset,
    hash,
  };
}
