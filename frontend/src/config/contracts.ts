import type { SupportedChainId } from './chains';

export interface ContractAddresses {
  factory: string;
  router: string;
  weth: string;
  limitOrder: string;
  multicall: string;
  batchSwap: string;
  qsnToken: string;
  stakeVault: string;
  launchpad: string;
  stakingFactory: string;
}

export const CONTRACT_ADDRESSES: Record<SupportedChainId, ContractAddresses> = {
  167000: {
    factory: process.env.NEXT_PUBLIC_TAIKO_FACTORY_ADDRESS || process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
    router: process.env.NEXT_PUBLIC_TAIKO_ROUTER_ADDRESS || process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '',
    weth: process.env.NEXT_PUBLIC_TAIKO_WETH_ADDRESS || process.env.NEXT_PUBLIC_WETH_ADDRESS || '',
    limitOrder: process.env.NEXT_PUBLIC_TAIKO_LIMIT_ORDER_ADDRESS || process.env.NEXT_PUBLIC_LIMIT_ORDER_ADDRESS || '',
    multicall: process.env.NEXT_PUBLIC_TAIKO_MULTICALL_ADDRESS || process.env.NEXT_PUBLIC_MULTICALL_ADDRESS || '',
    batchSwap: process.env.NEXT_PUBLIC_TAIKO_BATCH_SWAP_ADDRESS || process.env.NEXT_PUBLIC_BATCH_SWAP_ADDRESS || '',
    qsnToken: process.env.NEXT_PUBLIC_TAIKO_QSN_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_QSN_TOKEN_ADDRESS || '0x7532A2Ad305aA222B7B0e093aFe9e7036066c416',
    stakeVault: process.env.NEXT_PUBLIC_TAIKO_STAKE_VAULT_ADDRESS || process.env.NEXT_PUBLIC_STAKE_VAULT_ADDRESS || '',
    launchpad: process.env.NEXT_PUBLIC_TAIKO_LAUNCHPAD_ADDRESS || process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS || '',
    stakingFactory: process.env.NEXT_PUBLIC_TAIKO_STAKING_FACTORY_ADDRESS || process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS || '',
  },
  42161: {
    factory: process.env.NEXT_PUBLIC_ARB_FACTORY_ADDRESS || '',
    router: process.env.NEXT_PUBLIC_ARB_ROUTER_ADDRESS || '',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    limitOrder: process.env.NEXT_PUBLIC_ARB_LIMIT_ORDER_ADDRESS || '',
    multicall: process.env.NEXT_PUBLIC_ARB_MULTICALL_ADDRESS || '',
    batchSwap: process.env.NEXT_PUBLIC_ARB_BATCH_SWAP_ADDRESS || '',
    qsnToken: process.env.NEXT_PUBLIC_ARB_QSN_TOKEN_ADDRESS || '',
    stakeVault: process.env.NEXT_PUBLIC_ARB_STAKE_VAULT_ADDRESS || '',
    launchpad: process.env.NEXT_PUBLIC_ARB_LAUNCHPAD_ADDRESS || '',
    stakingFactory: process.env.NEXT_PUBLIC_ARB_STAKING_FACTORY_ADDRESS || '',
  },
  167009: {
    factory: process.env.NEXT_PUBLIC_HEKLA_FACTORY_ADDRESS || '',
    router: process.env.NEXT_PUBLIC_HEKLA_ROUTER_ADDRESS || '',
    weth: process.env.NEXT_PUBLIC_HEKLA_WETH_ADDRESS || '',
    limitOrder: process.env.NEXT_PUBLIC_HEKLA_LIMIT_ORDER_ADDRESS || '',
    multicall: process.env.NEXT_PUBLIC_HEKLA_MULTICALL_ADDRESS || '',
    batchSwap: process.env.NEXT_PUBLIC_HEKLA_BATCH_SWAP_ADDRESS || '',
    qsnToken: process.env.NEXT_PUBLIC_HEKLA_QSN_TOKEN_ADDRESS || '',
    stakeVault: process.env.NEXT_PUBLIC_HEKLA_STAKE_VAULT_ADDRESS || '',
    launchpad: process.env.NEXT_PUBLIC_HEKLA_LAUNCHPAD_ADDRESS || '',
    stakingFactory: process.env.NEXT_PUBLIC_HEKLA_STAKING_FACTORY_ADDRESS || '',
  },
  421614: {
    factory: process.env.NEXT_PUBLIC_ARB_SEPOLIA_FACTORY_ADDRESS || '0xB1EbA9F2243268E1E51b02F76Bbd31Ea849670fC',
    router: process.env.NEXT_PUBLIC_ARB_SEPOLIA_ROUTER_ADDRESS || '0x84A3400115C1A7950346E4f323862fE143382529',
    weth: '0xfDecf89e585583F405373dC33a122ebD7E8c53a8',
    limitOrder: process.env.NEXT_PUBLIC_ARB_SEPOLIA_LIMIT_ORDER_ADDRESS || '0xa558dC87BF7a8c0E288430d5B37E1603C2C07204',
    multicall: process.env.NEXT_PUBLIC_ARB_SEPOLIA_MULTICALL_ADDRESS || '',
    batchSwap: process.env.NEXT_PUBLIC_ARB_SEPOLIA_BATCH_SWAP_ADDRESS || '0x82a607e0A9Ea3EBd48c36fdC80263a7a50351A92',
    qsnToken: process.env.NEXT_PUBLIC_ARB_SEPOLIA_QSN_TOKEN_ADDRESS || '0xC50ACB48bd5dB2d1beBCBf77782F730C25957125',
    stakeVault: process.env.NEXT_PUBLIC_ARB_SEPOLIA_STAKE_VAULT_ADDRESS || '0x5F11576EF5b01e040b43EEF2E4E6E8F2EA388eCB',
    launchpad: process.env.NEXT_PUBLIC_ARB_SEPOLIA_LAUNCHPAD_ADDRESS || '0xAf10d6E72f1BF41cc9800ADdA9F6D915591B5e24',
    stakingFactory: process.env.NEXT_PUBLIC_ARB_SEPOLIA_STAKING_FACTORY_ADDRESS || '0xd76088BA63b1274F3e0070B04213949B4F848B71',
  },
};

export function getContracts(chainId: SupportedChainId): ContractAddresses {
  return CONTRACT_ADDRESSES[chainId];
}

export const CONTRACTS = CONTRACT_ADDRESSES[167000];

export const FACTORY_ABI = [
  {
    type: 'function',
    name: 'getPair',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allPairsLength',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createPair',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'PairCreated',
    inputs: [
      { name: 'token0', type: 'address', indexed: true },
      { name: 'token1', type: 'address', indexed: true },
      { name: 'pair', type: 'address', indexed: false },
      { name: 'fee', type: 'uint24', indexed: false },
      { name: 'pairIndex', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ROUTER_ABI = [
  {
    type: 'function',
    name: 'addLiquidity',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addLiquidityETH',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountTokenDesired', type: 'uint256' },
      { name: 'amountTokenMin', type: 'uint256' },
      { name: 'amountETHMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountToken', type: 'uint256' },
      { name: 'amountETH', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'removeLiquidity',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'liquidity', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForTokens',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'fees', type: 'uint24[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapExactETHForTokens',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'fees', type: 'uint24[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'swapExactTokensForETH',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'fees', type: 'uint24[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAmountsOut',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'fees', type: 'uint24[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
  },
] as const;

export const PAIR_ABI = [
  {
    type: 'function',
    name: 'getReserves',
    inputs: [],
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'token0',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'token1',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

export const QSN_TOKEN_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const STAKE_VAULT_ABI = [
  {
    type: 'function',
    name: 'stake',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimReward',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'exit',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getStakeInfo',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'pendingReward', type: 'uint256' },
      { name: 'stakeSince', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalStaked',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'rewardRate',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Staked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardClaimed',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'reward', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const LAUNCHPAD_ABI = [
  {
    type: 'function',
    name: 'createSale',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokensForSale', type: 'uint256' },
      { name: 'tokensForLiquidity', type: 'uint256' },
      { name: 'softCap', type: 'uint256' },
      { name: 'hardCap', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'liquidityPct', type: 'uint256' },
      { name: 'lpLockDuration', type: 'uint256' },
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_logoUrl', type: 'string' },
      { name: '_websiteUrl', type: 'string' },
      { name: '_socialUrl', type: 'string' },
    ],
    outputs: [{ name: 'saleId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'contribute',
    inputs: [{ name: 'saleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'finalize',
    inputs: [{ name: 'saleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimTokens',
    inputs: [{ name: 'saleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelSale',
    inputs: [{ name: 'saleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'refund',
    inputs: [{ name: 'saleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getSaleInfo',
    inputs: [{ name: 'saleId', type: 'uint256' }],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'softCap', type: 'uint256' },
      { name: 'hardCap', type: 'uint256' },
      { name: 'maxPerWallet', type: 'uint256' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'participants', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'finalized', type: 'bool' },
      { name: 'cancelled', type: 'bool' },
      { name: 'liquidityPct', type: 'uint256' },
      { name: 'lockDuration', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserContribution',
    inputs: [
      { name: 'saleId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'contributed', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getClaimableTokens',
    inputs: [
      { name: 'saleId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SaleCreated',
    inputs: [
      { name: 'saleId', type: 'uint256', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'Contributed',
    inputs: [
      { name: 'saleId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SaleFinalized',
    inputs: [
      { name: 'saleId', type: 'uint256', indexed: true },
      { name: 'totalRaised', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokensClaimed',
    inputs: [
      { name: 'saleId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SaleCancelled',
    inputs: [{ name: 'saleId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'Refunded',
    inputs: [
      { name: 'saleId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const BATCH_SWAP_ABI = [
  {
    type: 'function',
    name: 'batchSwapFromETH',
    inputs: [
      {
        name: 'orders',
        type: 'tuple[]',
        components: [
          { name: 'tokenOut', type: 'address' },
          { name: 'percentage', type: 'uint256' },
          { name: 'amountOutMin', type: 'uint256' },
          { name: 'path', type: 'address[]' },
        ],
      },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'batchSwapFromToken',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'totalAmountIn', type: 'uint256' },
      {
        name: 'orders',
        type: 'tuple[]',
        components: [
          { name: 'tokenOut', type: 'address' },
          { name: 'percentage', type: 'uint256' },
          { name: 'amountOutMin', type: 'uint256' },
          { name: 'path', type: 'address[]' },
        ],
      },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getBatchQuoteFromETH',
    inputs: [
      { name: 'ethAmount', type: 'uint256' },
      {
        name: 'orders',
        type: 'tuple[]',
        components: [
          { name: 'tokenOut', type: 'address' },
          { name: 'percentage', type: 'uint256' },
          { name: 'amountOutMin', type: 'uint256' },
          { name: 'path', type: 'address[]' },
        ],
      },
    ],
    outputs: [{ name: 'amountsOut', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'BatchSwapExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'totalAmountIn', type: 'uint256', indexed: false },
      { name: 'ordersCount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SingleSwapExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const STAKING_FACTORY_ABI = [
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      { name: 'stakeToken', type: 'address' },
      { name: 'rewardToken', type: 'address' },
      { name: 'rewardAmount', type: 'uint256' },
      { name: 'durationDays', type: 'uint256' },
      { name: 'minStake', type: 'uint256' },
      { name: 'maxStakePerUser', type: 'uint256' },
    ],
    outputs: [{ name: 'pool', type: 'address' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'allPoolsLength',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allPools',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolsByTokens',
    inputs: [
      { name: 'stakeToken', type: 'address' },
      { name: 'rewardToken', type: 'address' },
    ],
    outputs: [{ type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCreatorPools',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isPool',
    inputs: [{ name: 'pool', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createPoolFeeETH',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformRewardFeeBps',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'pool', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'stakeToken', type: 'address', indexed: false },
      { name: 'rewardToken', type: 'address', indexed: false },
      { name: 'rewardAmount', type: 'uint256', indexed: false },
      { name: 'duration', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const STAKING_POOL_ABI = [
  {
    type: 'function',
    name: 'stake',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimReward',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'exit',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPoolInfo',
    inputs: [],
    outputs: [
      { name: 'stakeToken', type: 'address' },
      { name: 'rewardToken', type: 'address' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'rewardRate', type: 'uint256' },
      { name: 'periodFinish', type: 'uint256' },
      { name: 'lastUpdateTime', type: 'uint256' },
      { name: 'rewardPerTokenStored', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserInfo',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'pendingReward', type: 'uint256' },
      { name: 'stakeSince', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'earned',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'estimatedAPR',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'remainingRewards',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Staked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardClaimed',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'reward', type: 'uint256', indexed: false },
    ],
  },
] as const;
