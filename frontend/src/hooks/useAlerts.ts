'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateAlertBody } from '@/lib/api';
import { useChain } from './useChain';

export function useAlerts(walletAddress: string | undefined) {
  const { chainId } = useChain();

  return useQuery({
    queryKey: ['alerts', chainId, walletAddress],
    queryFn: () => api.getAlerts(walletAddress!, chainId, true),
    enabled: !!walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42,
    staleTime: 15_000,
    refetchInterval: 30_000,
    select: (data) => data.alerts,
  });
}

export function useAlertCount(walletAddress: string | undefined) {
  const { chainId } = useChain();

  return useQuery({
    queryKey: ['alertCount', chainId, walletAddress],
    queryFn: () => api.getAlertCount(walletAddress!, chainId),
    enabled: !!walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42,
    staleTime: 10_000,
    refetchInterval: 20_000,
    select: (data) => data.count,
  });
}

export function useTriggeredAlerts(walletAddress: string | undefined) {
  const { chainId } = useChain();

  return useQuery({
    queryKey: ['triggeredAlerts', chainId, walletAddress],
    queryFn: () => api.getTriggeredAlerts(walletAddress!, chainId),
    enabled: !!walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42,
    staleTime: 10_000,
    refetchInterval: 20_000,
    select: (data) => data.notifications,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateAlertBody) => api.createAlert(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertCount'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, wallet }: { id: number; wallet: string }) =>
      api.deleteAlert(id, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertCount'] });
    },
  });
}

export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, wallet }: { id: number; wallet: string }) =>
      api.toggleAlert(id, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertCount'] });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, wallet }: { id: number; wallet: string }) =>
      api.dismissAlert(id, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertCount'] });
      queryClient.invalidateQueries({ queryKey: ['triggeredAlerts'] });
    },
  });
}
