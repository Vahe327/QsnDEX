import type { SupportedChainId } from './chains';

export interface TokenInfo {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

export const WETH: TokenInfo = {
  chainId: 167000,
  address: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x0000000000000000000000000000000000000000',
  name: 'Wrapped Ether',
  symbol: 'WETH',
  decimals: 18,
  logoURI: '/tokens/weth.png',
};

export const NATIVE_ETH: TokenInfo = {
  chainId: 167000,
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  logoURI: '/tokens/eth.png',
};

export const USDC: TokenInfo = {
  chainId: 167000,
  address: '0x07d83526730c7438048D55A4fc0b850e2adBC0CF',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
};

export const USDT: TokenInfo = {
  chainId: 167000,
  address: '0x2DEF195713CF4a606B49D07E520e22C17899a736',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
};

export const TAIKO: TokenInfo = {
  chainId: 167000,
  address: '0xc4C410459fbaD8D6DFa797E34a5F4649c5629B85',
  name: 'Taiko Token',
  symbol: 'TAIKO',
  decimals: 18,
  logoURI: 'https://assets.coingecko.com/coins/images/35175/small/taiko.png',
};

export const DEFAULT_TOKEN_LIST: TokenInfo[] = [
  NATIVE_ETH,
  WETH,
  USDC,
  USDT,
  TAIKO,
];

export const DEFAULT_TOKENS: Record<SupportedChainId, TokenInfo[]> = {
  167000: [
    {
      chainId: 167000,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      logoURI: '/tokens/eth.png',
    },
    {
      chainId: 167000,
      address: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI: '/tokens/weth.png',
    },
    {
      chainId: 167000,
      address: '0x07d83526730c7438048D55A4fc0b850e2adBC0CF',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    },
    {
      chainId: 167000,
      address: '0x2DEF195713CF4a606B49D07E520e22C17899a736',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    },
    {
      chainId: 167000,
      address: '0xc4C410459fbaD8D6DFa797E34a5F4649c5629B85',
      name: 'Taiko Token',
      symbol: 'TAIKO',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/35175/small/taiko.png',
    },
    {
      chainId: 167000,
      address: '0x7532A2Ad305aA222B7B0e093aFe9e7036066c416',
      name: 'Quantum Security Network',
      symbol: 'QSN',
      decimals: 18,
      logoURI: 'https://gateway.pinata.cloud/ipfs/bafkreib5x3mlgfb75x2h57y3pk3cjr6jgrvqfgpxv6fbufotm65heb44ky',
    },
  ],
  42161: [
    {
      chainId: 42161,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      logoURI: '/tokens/eth.png',
    },
    {
      chainId: 42161,
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI: '/tokens/weth.png',
    },
    {
      chainId: 42161,
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    },
    {
      chainId: 42161,
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    },
    {
      chainId: 42161,
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    },
    {
      chainId: 42161,
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8,
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    },
    {
      chainId: 42161,
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      name: 'Arbitrum',
      symbol: 'ARB',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    },
  ],
  167009: [
    {
      chainId: 167009,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      logoURI: '/tokens/eth.png',
    },
    {
      chainId: 167009,
      address: process.env.NEXT_PUBLIC_HEKLA_WETH_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI: '/tokens/weth.png',
    },
  ],
  421614: [
    {
      chainId: 421614,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      logoURI: '/tokens/eth.png',
    },
    {
      chainId: 421614,
      address: '0xfDecf89e585583F405373dC33a122ebD7E8c53a8',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      logoURI: '/tokens/weth.png',
    },
  ],
};

export function getDefaultTokensForChain(chainId: SupportedChainId): TokenInfo[] {
  return DEFAULT_TOKENS[chainId] ?? DEFAULT_TOKENS[167000];
}

export function getNativeToken(chainId: SupportedChainId): TokenInfo {
  const tokens = DEFAULT_TOKENS[chainId];
  return tokens?.[0] ?? NATIVE_ETH;
}

export const FEE_TIERS = [
  { value: 100, label: '0.01%', descriptionKey: 'pools.fee_01_desc' },
  { value: 500, label: '0.05%', descriptionKey: 'pools.fee_05_desc' },
  { value: 3000, label: '0.30%', descriptionKey: 'pools.fee_30_desc' },
  { value: 10000, label: '1.00%', descriptionKey: 'pools.fee_100_desc' },
] as const;

export const TOKEN_LIST_FORMAT = {
  name: 'QsnDEX Default List',
  logoURI: '/icons/logo.png',
  keywords: ['qsndex', 'taiko', 'arbitrum', 'dex'],
  version: { major: 2, minor: 0, patch: 0 },
  tokens: [...DEFAULT_TOKENS[167000], ...DEFAULT_TOKENS[42161]],
};
