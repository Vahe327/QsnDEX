'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CHAIN_CONFIG,
  isSupportedChainId,
  type SupportedChainId,
  type ChainConfig,
} from '@/config/chains';
import { getContracts, type ContractAddresses } from '@/config/contracts';
import { getDefaultTokensForChain, getNativeToken, type TokenInfo } from '@/config/tokens';
import { useChainStore } from '@/store/chainStore';

export interface UseChainReturn {
  chainId: SupportedChainId;
  isSupported: boolean;
  chainConfig: ChainConfig;
  contracts: ContractAddresses;
  tokens: TokenInfo[];
  nativeToken: TokenInfo;
  switchToChain: (targetChainId: SupportedChainId) => void;
  explorerUrl: string;
  bridgeUrl: string;
}

export function useChain(): UseChainReturn {
  const selectedChainId = useChainStore((s) => s.selectedChainId);
  const setSelectedChainId = useChainStore((s) => s.setSelectedChainId);
  const queryClient = useQueryClient();

  const activeChainId: SupportedChainId = isSupportedChainId(selectedChainId)
    ? selectedChainId
    : (167000 as SupportedChainId);

  const chainConfig = CHAIN_CONFIG[activeChainId];
  const contracts = useMemo(() => getContracts(activeChainId), [activeChainId]);
  const tokens = useMemo(() => getDefaultTokensForChain(activeChainId), [activeChainId]);
  const nativeToken = useMemo(() => getNativeToken(activeChainId), [activeChainId]);

  const switchToChain = useCallback(
    (targetChainId: SupportedChainId) => {
      setSelectedChainId(targetChainId);
      setTimeout(() => {
        queryClient.invalidateQueries();
      }, 100);
    },
    [setSelectedChainId, queryClient]
  );

  return {
    chainId: activeChainId,
    isSupported: true,
    chainConfig,
    contracts,
    tokens,
    nativeToken,
    switchToChain,
    explorerUrl: chainConfig.explorerUrl,
    bridgeUrl: chainConfig.bridgeUrl,
  };
}
