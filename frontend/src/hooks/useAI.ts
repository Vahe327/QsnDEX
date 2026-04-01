'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getLocale } from '@/i18n';
import { useChain } from './useChain';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAI() {
  const { address: account } = useAccount();
  const { chainId } = useChain();

  const analyzeToken = useCallback(
    (tokenAddress: string) => {
      if (!account) throw new Error('Wallet not connected');
      return api.analyzeToken(tokenAddress, account, getLocale(), chainId);
    },
    [account, chainId]
  );

  const analyzePool = useCallback(
    (poolAddress: string) => {
      if (!account) throw new Error('Wallet not connected');
      return api.analyzePool(poolAddress, account, getLocale(), chainId);
    },
    [account, chainId]
  );

  const swapInsight = useCallback(
    (tokenIn: string, tokenOut: string) => {
      return api.swapInsight(tokenIn, tokenOut, getLocale(), chainId);
    },
    [chainId]
  );

  return {
    analyzeToken,
    analyzePool,
    swapInsight,
    isConnected: !!account,
  };
}

export function useTokenAnalysis(tokenAddress?: string) {
  const { address: account } = useAccount();
  const { chainId } = useChain();
  const locale = getLocale();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai', 'analyzeToken', chainId, tokenAddress, account, locale],
    queryFn: () => api.analyzeToken(tokenAddress!, account!, locale, chainId),
    enabled: !!tokenAddress && !!account,
    staleTime: 120_000,
  });

  return {
    analysis: data?.analysis ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function usePoolAnalysis(poolAddress?: string) {
  const { address: account } = useAccount();
  const { chainId } = useChain();
  const locale = getLocale();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai', 'analyzePool', chainId, poolAddress, account, locale],
    queryFn: () => api.analyzePool(poolAddress!, account!, locale, chainId),
    enabled: !!poolAddress && !!account,
    staleTime: 120_000,
  });

  return {
    insight: data?.insight ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useSwapInsight(tokenIn?: string, tokenOut?: string) {
  const { chainId } = useChain();
  const locale = getLocale();

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai', 'swapInsight', chainId, tokenIn, tokenOut, locale],
    queryFn: () => api.swapInsight(tokenIn!, tokenOut!, locale, chainId),
    enabled: !!tokenIn && !!tokenOut,
    staleTime: 60_000,
  });

  return {
    insight: data?.insight ?? null,
    isLoading,
    error,
  };
}

export function useAIChat() {
  const { address: account } = useAccount();
  const { chainId } = useChain();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (userMessage: string) => {
      if (!account) throw new Error('Wallet not connected');

      const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
      setMessages(newMessages);

      const { response } = await api.aiChat(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        account,
        getLocale(),
        chainId
      );

      return response;
    },
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.message },
      ]);
      setRequestsRemaining(response.requests_remaining);
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      mutation.mutate(message);
    },
    [mutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setRequestsRemaining(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading: mutation.isPending,
    error: mutation.error,
    requestsRemaining,
  };
}
