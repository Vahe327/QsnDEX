export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: number | string | undefined | null): string {
  if (num == null) return '0.00';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0.00';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  if (n > 0) return n.toFixed(5);
  return '0.00';
}

export function formatUSD(value: number | undefined | null): string {
  return `$${formatNumber(value ?? 0)}`;
}

export function formatPercent(value: number | string | undefined | null): string {
  if (value == null) return '0.00%';
  const v = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(v)) return '0.00%';
  return `${v.toFixed(2)}%`;
}

export function formatTokenAmount(amount: string | bigint, decimals: number): string {
  if (typeof amount === 'string' && amount.includes('.')) {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.000000' : num.toFixed(6);
  }
  try {
    const raw = typeof amount === 'bigint' ? amount : BigInt(amount || '0');
    const divisor = BigInt(10 ** decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 6);
    return `${whole}.${fractionStr}`;
  } catch {
    return '0.000000';
  }
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function getExplorerUrl(txHash: string, explorerBase?: string): string {
  const base = explorerBase || getActiveExplorerUrl();
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, explorerBase?: string): string {
  const base = explorerBase || getActiveExplorerUrl();
  return `${base}/address/${address}`;
}

function getActiveExplorerUrl(): string {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('qsndex-chain') : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      const chainId = parsed?.state?.selectedChainId;
      if (chainId) {
        const explorers: Record<number, string> = {
          167000: 'https://taikoscan.io',
          42161: 'https://arbiscan.io',
          167009: 'https://hekla.taikoscan.io',
          421614: 'https://sepolia.arbiscan.io',
        };
        if (explorers[chainId]) return explorers[chainId];
      }
    }
  } catch {}
  return 'https://taikoscan.io';
}

export function getPriceImpactColor(impact: number): string {
  if (impact < 1) return 'text-success';
  if (impact < 3) return 'text-warning';
  if (impact < 5) return 'text-orange-400';
  return 'text-danger';
}

export function getPriceImpactLevel(impact: number): 'low' | 'medium' | 'high' | 'very_high' | 'blocked' {
  if (impact < 1) return 'low';
  if (impact < 3) return 'medium';
  if (impact < 5) return 'high';
  if (impact < 15) return 'very_high';
  return 'blocked';
}
