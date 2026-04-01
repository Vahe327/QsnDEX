'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Abi, Address } from 'viem';
import { useGasOverrides } from '@/hooks/useGasPrice';

interface UseContractReadParams {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  enabled?: boolean;
  watch?: boolean;
}

interface UseContractWriteParams {
  address: Address;
  abi: Abi;
  functionName: string;
}

export function useContractRead({
  address,
  abi,
  functionName,
  args,
  enabled = true,
  watch = false,
}: UseContractReadParams) {
  const result = useReadContract({
    address,
    abi,
    functionName,
    args,
    query: {
      enabled: enabled && !!address,
      refetchInterval: watch ? 10_000 : false,
    },
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useContractWrite({ address, abi, functionName }: UseContractWriteParams) {
  const { writeContract, writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const { getGasOverrides } = useGasOverrides();

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  async function execute(args: readonly unknown[], value?: bigint) {
    const gas = await getGasOverrides();
    return writeContractAsync({
      address,
      abi,
      functionName,
      args,
      ...(value !== undefined ? { value } : {}),
      ...gas,
    });
  }

  return {
    execute,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

export { useContractRead as useContractReadHook, useContractWrite as useContractWriteHook };
