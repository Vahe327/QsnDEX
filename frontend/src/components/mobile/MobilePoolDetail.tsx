'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Droplets, Plus, Minus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { api } from '@/lib/api';
import { useChain } from '@/hooks/useChain';
import { PoolPairIcon } from '@/components/pools/PoolPairIcon';
import { TVLChart } from '@/components/charts/TVLChart';
import { VolumeChart } from '@/components/charts/VolumeChart';

interface MobilePoolDetailProps {
  address: string;
}

export function MobilePoolDetail({ address }: MobilePoolDetailProps) {
  const router = useRouter();
  const { chainId } = useChain();
  const [activeChart, setActiveChart] = useState<'tvl' | 'volume'>('tvl');

  const { data, isLoading } = useQuery({
    queryKey: ['pool', chainId, address],
    queryFn: () => api.getPool(address, chainId),
    staleTime: 30_000,
  });

  const pool = data?.pool;

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['poolChart', chainId, address, '7d'],
    queryFn: () => api.getPoolChart(address, '7d', chainId),
    staleTime: 60_000,
    enabled: !!pool,
  });

  const tvlChartData = (chartData?.chart ?? []).map((p: any) => {
    const ts = p.timestamp || p.time;
    const time = typeof ts === 'number' ? ts : Math.floor(new Date(ts).getTime() / 1000);
    return { time: isNaN(time) ? 0 : time, value: Number(p.tvl_usd ?? p.tvl ?? 0) || 0 };
  }).filter((p: any) => p.time > 0);

  const volumeChartData = (chartData?.chart ?? []).map((p: any) => {
    const ts = p.timestamp || p.time;
    const time = typeof ts === 'number' ? ts : Math.floor(new Date(ts).getTime() / 1000);
    return { time: isNaN(time) ? 0 : time, value: Number(p.volume_usd ?? p.volume ?? 0) || 0 };
  }).filter((p: any) => p.time > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="px-3 pt-3 pb-4">
        <button
          onClick={() => router.push('/app/pools')}
          className="flex items-center gap-2 mb-3 text-sm font-semibold min-h-[44px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('pools.title')}
        </button>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('pools.pool_not_found')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-4">
      <button
        onClick={() => router.push('/app/pools')}
        className="flex items-center gap-2 mb-3 text-sm font-semibold min-h-[44px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('pools.title')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <PoolPairIcon
              token0Symbol={pool.token0_symbol}
              token1Symbol={pool.token1_symbol}
              token0Logo={pool.token0_logo}
              token1Logo={pool.token1_logo}
              size="md"
            />
            <div>
              <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
                {pool.token0_symbol}/{pool.token1_symbol}
              </h1>
              <span
                className="text-xs font-[var(--font-mono)] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}
              >
                {pool.fee <= 100 ? '0.01%' : pool.fee <= 500 ? '0.05%' : pool.fee <= 3000 ? '0.30%' : '1.00%'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {t('pools.tvl')}
              </div>
              <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                {formatUSD(pool.tvl_usd ?? pool.tvl)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {t('pools.volume_24h')}
              </div>
              <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                {formatUSD(pool.volume_24h_usd ?? pool.volume_24h)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {t('pools.apr')}
              </div>
              <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--accent-tertiary)' }}>
                {formatPercent(pool.apr)}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex gap-1 p-2">
            {(['tvl', 'volume'] as const).map((chartType) => (
              <button
                key={chartType}
                onClick={() => setActiveChart(chartType)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-semibold min-h-[36px] transition-all',
                  activeChart === chartType ? 'text-white' : 'text-[var(--text-tertiary)]'
                )}
                style={activeChart === chartType ? { background: 'var(--gradient-primary)' } : undefined}
              >
                {chartType === 'tvl' ? t('pools.tvl') : t('pools.volume')}
              </button>
            ))}
          </div>
          <div className="h-[200px] px-2 pb-2">
            {activeChart === 'tvl' ? (
              <TVLChart data={tvlChartData} height={180} loading={chartLoading} />
            ) : (
              <VolumeChart data={volumeChartData} height={180} loading={chartLoading} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/app/pools/add?pool=${address}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold min-h-[48px]"
            style={{ background: 'var(--gradient-primary)', color: '#000', boxShadow: 'var(--glow-gold)' }}
          >
            <Plus className="w-4 h-4" />
            {t('pools.add_liquidity')}
          </Link>
          <Link
            href={`/app/pools/remove?pool=${address}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold min-h-[48px]"
            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            <Minus className="w-4 h-4" />
            {t('pools.remove_liquidity')}
          </Link>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('pools.composition')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {pool.token0_symbol}
              </span>
              <span className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                {pool.reserve0 ? formatUSD(parseFloat(pool.reserve0)) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {pool.token1_symbol}
              </span>
              <span className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                {pool.reserve1 ? formatUSD(parseFloat(pool.reserve1)) : '-'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
