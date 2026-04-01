import { defineChain } from 'viem';

const l2Fees = {
  defaultPriorityFee: 1_000_000n,
  baseFeeMultiplier: 1.5,
} satisfies { defaultPriorityFee: bigint; baseFeeMultiplier: number };

export const taiko = defineChain({
  id: 167000,
  name: 'Taiko Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_TAIKO_RPC || 'https://rpc.mainnet.taiko.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Taikoscan', url: 'https://taikoscan.io' },
  },
  fees: l2Fees,
});

export const arbitrumOne = defineChain({
  id: 42161,
  name: 'Arbitrum One',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARB_RPC || 'https://arb1.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  },
  fees: l2Fees,
});

export const taikoHekla = defineChain({
  id: 167009,
  name: 'Taiko Hekla',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_TAIKO_TESTNET_RPC || 'https://rpc.hekla.taiko.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Hekla Explorer', url: 'https://hekla.taikoscan.io' },
  },
  testnet: true,
  fees: l2Fees,
});

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARB_TESTNET_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'Arbiscan Sepolia', url: 'https://sepolia.arbiscan.io' },
  },
  testnet: true,
  fees: l2Fees,
});

export const SUPPORTED_CHAINS = [taiko, arbitrumOne, taikoHekla, arbitrumSepolia] as const;
export const DEFAULT_CHAIN = taiko;

export type SupportedChainId = 167000 | 42161 | 167009 | 421614;

export interface ChainConfig {
  name: string;
  shortName: string;
  logo: string;
  color: string;
  explorerUrl: string;
  bridgeUrl: string;
  testnet: boolean;
}

export const CHAIN_CONFIG: Record<SupportedChainId, ChainConfig> = {
  167000: {
    name: 'Taiko Mainnet',
    shortName: 'Taiko',
    logo: '/chains/taiko.svg',
    color: '#E81899',
    explorerUrl: 'https://taikoscan.io',
    bridgeUrl: 'https://bridge.taiko.xyz',
    testnet: false,
  },
  42161: {
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    logo: '/chains/arbitrum.svg',
    color: '#28A0F0',
    explorerUrl: 'https://arbiscan.io',
    bridgeUrl: 'https://bridge.arbitrum.io',
    testnet: false,
  },
  167009: {
    name: 'Taiko Hekla',
    shortName: 'Hekla',
    logo: '/chains/taiko.svg',
    color: '#E81899',
    explorerUrl: 'https://hekla.taikoscan.io',
    bridgeUrl: 'https://bridge.hekla.taiko.xyz',
    testnet: true,
  },
  421614: {
    name: 'Arbitrum Sepolia',
    shortName: 'Arb Sepolia',
    logo: '/chains/arbitrum.svg',
    color: '#28A0F0',
    explorerUrl: 'https://sepolia.arbiscan.io',
    bridgeUrl: 'https://bridge.arbitrum.io',
    testnet: true,
  },
};

export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return chainId === 167000 || chainId === 42161 || chainId === 167009 || chainId === 421614;
}
