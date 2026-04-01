'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useChainStore } from '@/store/chainStore';

type TokenIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TokenIconProps {
  address?: string;
  symbol: string;
  logoURI?: string;
  chainId?: number;
  size?: TokenIconSize;
  className?: string;
}

const sizeMap: Record<TokenIconSize, { px: number; text: string }> = {
  xs: { px: 20, text: 'text-[8px]' },
  sm: { px: 24, text: 'text-[10px]' },
  md: { px: 32, text: 'text-xs' },
  lg: { px: 40, text: 'text-sm' },
  xl: { px: 48, text: 'text-base' },
};

const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();

function getTrustWalletChain(chainId: number): string | null {
  switch (chainId) {
    case 1: return 'ethereum';
    case 42161: return 'arbitrum';
    case 421614: return 'arbitrum';
    case 10: return 'optimism';
    case 137: return 'polygon';
    case 56: return 'smartchain';
    case 43114: return 'avalanchec';
    case 167000: return null;
    case 167009: return null;
    default: return null;
  }
}

function get1inchChainId(chainId: number): number | null {
  switch (chainId) {
    case 1: return 1;
    case 42161: return 42161;
    case 421614: return 42161;
    case 10: return 10;
    case 137: return 137;
    case 56: return 56;
    case 167000: return 1;
    case 167009: return 1;
    default: return null;
  }
}

const KNOWN_ICONS: Record<string, string> = {
  ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  WETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  USDC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  USDT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  DAI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  WBTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  ARB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x912CE59144191C1204E64559FE8253a0e49E6548/logo.png',
  TAIKO: 'https://assets.coingecko.com/coins/images/35175/small/taiko.png',
  QSN: 'https://gateway.pinata.cloud/ipfs/bafkreib5x3mlgfb75x2h57y3pk3cjr6jgrvqfgpxv6fbufotm65heb44ky',
};

function buildIconUrls(address?: string, logoURI?: string, chainId?: number, symbol?: string): string[] {
  const urls: string[] = [];

  if (!address) {
    if (symbol && KNOWN_ICONS[symbol.toUpperCase()]) {
      urls.push(KNOWN_ICONS[symbol.toUpperCase()]);
    }
    if (logoURI) urls.push(logoURI);
    return urls;
  }

  const addr = address.toLowerCase();
  const checksumAddr = address;
  const upperSymbol = symbol?.toUpperCase() ?? '';

  if (upperSymbol && KNOWN_ICONS[upperSymbol]) {
    urls.push(KNOWN_ICONS[upperSymbol]);
  }

  if (addr === NATIVE_ADDRESS) {
    if (!urls.length) {
      urls.push('https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png');
    }
    return urls;
  }

  const twChain = getTrustWalletChain(chainId ?? 0);
  if (twChain) {
    urls.push(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${twChain}/assets/${checksumAddr}/logo.png`);
  }
  if (chainId === 167000) {
    urls.push(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checksumAddr}/logo.png`);
  }

  const oneInchChain = get1inchChainId(chainId ?? 0);
  if (oneInchChain) {
    urls.push(`https://tokens.1inch.io/v1.2/${oneInchChain}/${addr}.png`);
  }

  const geckoNetwork = chainId === 42161 ? 'arbitrum' : chainId === 167000 ? 'taiko' : 'eth';
  urls.push(`https://www.geckoterminal.com/images/tokens/${geckoNetwork}/${addr}.png`);

  if (logoURI && !urls.includes(logoURI)) {
    urls.push(logoURI);
  }

  return urls;
}

function symbolToColor(symbol: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return [`hsl(${h}, 60%, 45%)`, `hsl(${(h + 40) % 360}, 50%, 35%)`];
}

export function TokenIcon({ address, symbol, logoURI, chainId: chainIdProp, size = 'md', className }: TokenIconProps) {
  const storeChainId = useChainStore((s) => s.selectedChainId);
  const chainId = chainIdProp ?? storeChainId;
  const [urlIndex, setUrlIndex] = useState(0);
  const urls = useMemo(() => buildIconUrls(address, logoURI, chainId, symbol), [address, logoURI, chainId, symbol]);
  const { px, text } = sizeMap[size];

  const currentUrl = urls[urlIndex];
  const showFallback = !currentUrl || urlIndex >= urls.length;

  const handleError = () => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex((prev) => prev + 1);
    } else {
      setUrlIndex(urls.length);
    }
  };

  const [color1, color2] = useMemo(() => symbolToColor(symbol || '?'), [symbol]);

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center',
        className,
      )}
      style={{
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        background: showFallback ? `linear-gradient(135deg, ${color1}, ${color2})` : 'var(--bg-surface-2)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {showFallback ? (
        <span
          className={cn('font-bold select-none', text)}
          style={{
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {symbol?.slice(0, 2)?.toUpperCase() || '?'}
        </span>
      ) : (
        <img
          src={currentUrl}
          alt={symbol}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          onError={handleError}
          loading="lazy"
          draggable={false}
        />
      )}
    </div>
  );
}
