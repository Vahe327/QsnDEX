'use client';

import { useRouter } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';
import { PoolPairIcon } from './PoolPairIcon';
import { Badge } from '@/components/common/Badge';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD, formatPercent } from '@/lib/formatters';

interface Position {
  pool_address: string;
  token0_symbol: string;
  token1_symbol: string;
  token0_logo?: string;
  token1_logo?: string;
  fee: number;
  value_usd: number;
  share_percent: number;
  fees_earned_usd: number;
  token0_amount: string;
  token1_amount: string;
}

interface PositionCardProps {
  position: Position;
  className?: string;
}

export function PositionCard({ position, className }: PositionCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/app/pools/${position.pool_address}`)}
      className={cn('card p-5 cursor-pointer', className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PoolPairIcon
            token0Symbol={position.token0_symbol}
            token1Symbol={position.token1_symbol}
            token0Logo={position.token0_logo}
            token1Logo={position.token1_logo}
            size="md"
          />
          <div>
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {position.token0_symbol}/{position.token1_symbol}
            </span>
            <Badge variant="default" className="ml-2 text-[10px]">
              {position.fee <= 100 ? '0.01%' : position.fee <= 500 ? '0.05%' : position.fee <= 3000 ? '0.30%' : '1.00%'}
            </Badge>
          </div>
        </div>
        <span className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
          {formatUSD(position.value_usd)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
        <div>
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
            {t('pools.your_share')}
          </span>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatPercent(position.share_percent)}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
            {t('pools.fees_earned')}
          </span>
          <p className="text-sm font-semibold text-[var(--accent-tertiary)] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatUSD(position.fees_earned_usd)}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
            {t('pools.composition')}
          </span>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-tight" style={{ fontFamily: 'var(--font-mono)' }}>
            {position.token0_amount} {position.token0_symbol}
            <br />
            {position.token1_amount} {position.token1_symbol}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/pools/add?pool=${position.pool_address}`);
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold',
            'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
            'hover:bg-[var(--accent-primary)]/20 transition-all duration-200',
            'min-h-[44px]'
          )}
        >
          <Plus size={16} />
          {t('pools.add_liquidity')}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/pools/remove?pool=${position.pool_address}`);
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold',
            'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
            'hover:bg-[var(--accent-danger)]/20 transition-all duration-200',
            'min-h-[44px]'
          )}
        >
          <Minus size={16} />
          {t('pools.remove_liquidity')}
        </button>
      </div>
    </div>
  );
}
