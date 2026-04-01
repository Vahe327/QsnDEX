'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Plus, ArrowRightLeft, Lock, TrendingUp, BarChart3, Percent } from 'lucide-react';
import { TokenIcon } from '@/components/common/TokenIcon';
import { TVLChart } from '@/components/charts/TVLChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { motion } from 'framer-motion';
import { usePool, usePoolChart } from '@/hooks/usePools';
import { PoolPairIcon } from './PoolPairIcon';
import { ILCalculator } from '@/components/il/ILCalculator';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { Skeleton } from '@/components/common/Skeleton';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD, formatPercent, getExplorerAddressUrl } from '@/lib/formatters';

interface PoolDetailProps {
  poolAddress: string;
  className?: string;
}

const statIcons = [
  { icon: Lock, gradient: 'from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/5', glow: 'rgba(0,229,255,0.12)' },
  { icon: TrendingUp, gradient: 'from-[var(--accent-tertiary)]/20 to-[var(--accent-tertiary)]/5', glow: 'rgba(0,255,163,0.12)' },
  { icon: BarChart3, gradient: 'from-[var(--accent-secondary)]/20 to-[var(--accent-secondary)]/5', glow: 'rgba(123,97,255,0.12)' },
  { icon: Percent, gradient: 'from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/5', glow: 'rgba(0,229,255,0.08)' },
];

export function PoolDetail({ poolAddress, className }: PoolDetailProps) {
  const router = useRouter();
  const { pool, isLoading } = usePool(poolAddress);
  const [chartPeriod, setChartPeriod] = useState('7d');
  const { chart, isLoading: isChartLoading } = usePoolChart(poolAddress, chartPeriod);
  const [activeChart, setActiveChart] = useState('tvl');

  const chartTabs = [
    { id: 'tvl', label: t('pools.tvl') },
    { id: 'volume', label: t('pools.volume') },
  ];

  const periodTabs = ['24h', '7d', '30d', '90d'];

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="card" height={200} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton variant="card" height={80} count={4} />
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className={cn('card p-10 text-center', className)}>
        <p className="text-[var(--text-secondary)]">{t('pools.pool_not_found')}</p>
      </div>
    );
  }

  const feeLabel = pool.fee <= 100 ? '0.01%' : pool.fee <= 500 ? '0.05%' : pool.fee <= 3000 ? '0.30%' : '1.00%';

  const stats = [
    { label: t('pools.tvl'), value: formatUSD(pool.tvl_usd ?? pool.tvl ?? 0), color: 'text-[var(--text-primary)]' },
    { label: t('pools.apr'), value: formatPercent(pool.apr_24h ?? pool.apr ?? 0), color: 'text-[var(--accent-tertiary)]' },
    { label: `${t('pools.volume')} 24h`, value: formatUSD(pool.volume_24h_usd ?? pool.volume_24h ?? 0), color: 'text-[var(--text-primary)]' },
    { label: t('pools.fee_tier'), value: feeLabel, color: 'text-[var(--accent-primary)]' },
  ];

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/app/pools')}
          className="p-2 rounded-xl hover:bg-[var(--bg-surface-2)] transition-all duration-200 hover:shadow-[0_0_10px_rgba(0,229,255,0.06)]"
        >
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <PoolPairIcon
          token0Symbol={pool.token0_symbol}
          token1Symbol={pool.token1_symbol}
          token0Logo={pool.token0_logo}
          token1Logo={pool.token1_logo}
          size="lg"
        />
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {pool.token0_symbol}/{pool.token1_symbol}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default">{feeLabel}</Badge>
            <a
              href={getExplorerAddressUrl(pool.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {pool.address.slice(0, 8)}...{pool.address.slice(-6)}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, idx) => {
          const StatIcon = statIcons[idx].icon;
          return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            className="card p-4"
          >
            <div
              className={cn('w-8 h-8 rounded-lg mb-2 flex items-center justify-center bg-gradient-to-br', statIcons[idx].gradient)}
              style={{ boxShadow: `0 0 12px ${statIcons[idx].glow}` }}
            >
              <StatIcon size={16} />
            </div>
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
              {stat.label}
            </span>
            <p className={cn('text-lg font-bold mt-0.5', stat.color)} style={{ fontFamily: 'var(--font-mono)' }}>
              {stat.value}
            </p>
          </motion.div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <Tabs
            tabs={chartTabs}
            activeTab={activeChart}
            onTabChange={setActiveChart}
            layoutId="pool-chart-tab"
          />
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            {periodTabs.map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200',
                  chartPeriod === p
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,229,255,0.1)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] overflow-hidden">
          {isChartLoading ? (
            <Skeleton variant="card" width="100%" height="100%" />
          ) : chart.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-[var(--text-tertiary)]">{t('pools.no_chart_data')}</p>
            </div>
          ) : activeChart === 'tvl' ? (
            <TVLChart data={chart.map((p: any) => {
              const ts = p.timestamp || p.time;
              const time = typeof ts === 'number' ? ts : Math.floor(new Date(ts).getTime() / 1000);
              return { time: isNaN(time) ? 0 : time, value: Number(p.tvl_usd ?? p.tvl ?? 0) || 0 };
            }).filter((p: any) => p.time > 0)} />
          ) : (
            <VolumeChart data={chart.map((p: any) => {
              const ts = p.timestamp || p.time;
              const time = typeof ts === 'number' ? ts : Math.floor(new Date(ts).getTime() / 1000);
              return { time: isNaN(time) ? 0 : time, value: Number(p.volume_usd ?? p.volume ?? 0) || 0 };
            }).filter((p: any) => p.time > 0)} />
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-semibold text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
          {t('pools.pool_composition')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
            <TokenIcon address={pool.token0} symbol={pool.token0_symbol} size="md" />
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{pool.token0_symbol}</span>
              <p className="text-xs text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {pool.reserve0_formatted != null ? Number(pool.reserve0_formatted).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '0'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
            <TokenIcon address={pool.token1} symbol={pool.token1_symbol} size="md" />
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{pool.token1_symbol}</span>
              <p className="text-xs text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {pool.reserve1_formatted != null ? Number(pool.reserve1_formatted).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ILCalculator
          poolAddress={pool.address}
          poolName={`${pool.token0_symbol} / ${pool.token1_symbol}`}
          poolApr={pool.apr_24h ?? 0}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/app/pools/add?pool=${pool.address}`)}
          className="btn-primary flex-1"
        >
          <Plus size={18} />
          {t('pools.add_liquidity')}
        </button>
        <button
          onClick={() => router.push(`/app/swap?tokenIn=${pool.token0_address}&tokenOut=${pool.token1_address}`)}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <ArrowRightLeft size={18} />
          {t('nav.swap')}
        </button>
      </div>
    </div>
  );
}
