'use client';

import { useRouter } from 'next/navigation';
import { PoolPairIcon } from './PoolPairIcon';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatPercent } from '@/lib/formatters';

interface PoolRowProps {
  pool: {
    address: string;
    token0_symbol: string;
    token1_symbol: string;
    token0_logo?: string;
    token1_logo?: string;
    fee: number;
    tvl?: number;
    tvl_usd?: number;
    apr?: number;
    apr_24h?: number;
    volume_24h?: number;
    volume_24h_usd?: number;
  };
  className?: string;
}

function feeBpsToLabel(fee: number): string {
  if (fee <= 100) return '0.01%';
  if (fee <= 500) return '0.05%';
  if (fee <= 3000) return '0.30%';
  return '1.00%';
}

export function PoolRow({ pool, className }: PoolRowProps) {
  const router = useRouter();

  function handleClick() {
    router.push(`/app/pools/${pool.address}`);
  }

  const tvl = pool.tvl ?? pool.tvl_usd ?? 0;
  const apr = pool.apr ?? pool.apr_24h ?? 0;
  const volume = pool.volume_24h ?? pool.volume_24h_usd ?? 0;
  const isHighAPR = apr > 10;

  return (
    <>
      <tr
        onClick={handleClick}
        className={cn(
          'hidden sm:table-row cursor-pointer',
          'hover:bg-[var(--bg-surface-3)]/50 transition-all duration-200',
          'hover:shadow-[inset_0_0_0_1px_var(--border-glow)]',
          className,
        )}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <PoolPairIcon
              token0Symbol={pool.token0_symbol}
              token1Symbol={pool.token1_symbol}
              token0Logo={pool.token0_logo}
              token1Logo={pool.token1_logo}
              size="sm"
            />
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {pool.token0_symbol}/{pool.token1_symbol}
              </span>
              <Badge variant="default" className="ml-2 text-[10px]">
                {feeBpsToLabel(pool.fee)}
              </Badge>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 text-right">
          <span className="text-sm text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatUSD(tvl)}
          </span>
        </td>
        <td className="px-5 py-3.5 text-right">
          <span
            className={cn(
              'text-sm font-semibold',
              isHighAPR ? 'text-[var(--accent-tertiary)]' : 'text-[var(--text-primary)]',
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {formatPercent(apr)}
          </span>
        </td>
        <td className="px-5 py-3.5 text-right">
          <span className="text-sm text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatUSD(volume)}
          </span>
        </td>
      </tr>

      <div
        onClick={handleClick}
        className={cn(
          'sm:hidden card p-4 cursor-pointer',
          className,
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <PoolPairIcon
              token0Symbol={pool.token0_symbol}
              token1Symbol={pool.token1_symbol}
              token0Logo={pool.token0_logo}
              token1Logo={pool.token1_logo}
              size="md"
            />
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {pool.token0_symbol}/{pool.token1_symbol}
              </span>
              <Badge variant="default" className="ml-2 text-[10px]">
                {feeBpsToLabel(pool.fee)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase">{t('pools.tvl')}</span>
            <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatUSD(tvl)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase">{t('pools.apr')}</span>
            <p
              className={cn(
                'text-sm font-semibold',
                isHighAPR ? 'text-[var(--accent-tertiary)]' : 'text-[var(--text-primary)]',
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {formatPercent(apr)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase">{t('pools.volume_24h')}</span>
            <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatUSD(volume)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
