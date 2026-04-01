import { CHAIN_CONFIG, type SupportedChainId } from '@/config/chains';

export const TAIKO_CHAIN_ID = 167000;
export const ARBITRUM_CHAIN_ID = 42161;
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const DEFAULT_SLIPPAGE = 50; // 0.5% in basis points
export const DEFAULT_DEADLINE_MINUTES = 20;

export const SLIPPAGE_OPTIONS = [
  { value: 10, label: '0.1%' },
  { value: 50, label: '0.5%' },
  { value: 100, label: '1.0%' },
] as const;

export const DEADLINE_OPTIONS = [
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
] as const;

export const BRIDGE_URL = 'https://bridge.taiko.xyz';
export const EXPLORER_URL = 'https://taikoscan.io';

export function getExplorerUrl(chainId: SupportedChainId): string {
  return CHAIN_CONFIG[chainId]?.explorerUrl ?? EXPLORER_URL;
}

export function getBridgeUrl(chainId: SupportedChainId): string {
  return CHAIN_CONFIG[chainId]?.bridgeUrl ?? BRIDGE_URL;
}
