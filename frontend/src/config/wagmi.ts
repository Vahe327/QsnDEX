'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { taiko, arbitrumOne, taikoHekla, arbitrumSepolia } from './chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'QsnDEX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'qsndex',
  chains: [taiko, arbitrumOne, taikoHekla, arbitrumSepolia],
  transports: {
    [taiko.id]: http(process.env.NEXT_PUBLIC_TAIKO_RPC || 'https://rpc.mainnet.taiko.xyz'),
    [arbitrumOne.id]: http(process.env.NEXT_PUBLIC_ARB_RPC || 'https://arb1.arbitrum.io/rpc'),
    [taikoHekla.id]: http(process.env.NEXT_PUBLIC_TAIKO_TESTNET_RPC || 'https://rpc.hekla.taiko.xyz'),
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARB_TESTNET_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'),
  },
  ssr: true,
});
