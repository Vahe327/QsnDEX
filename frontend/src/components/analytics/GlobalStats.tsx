'use client';

import { motion } from 'framer-motion';
import { DollarSign, BarChart3, Droplets, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatNumber } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChain } from '@/hooks/useChain';

interface GlobalStatsProps {
  className?: string;
}

const STAT_ICONS = [DollarSign, BarChart3, Droplets, ArrowLeftRight];

const STAT_GRADIENTS = [
  { from: 'var(--accent-primary)', to: 'var(--accent-secondary)', glow: 'rgba(0,229,255,0.15)' },
  { from: 'var(--accent-secondary)', to: 'var(--accent-danger)', glow: 'rgba(123,97,255,0.15)' },
  { from: 'var(--accent-tertiary)', to: 'var(--accent-primary)', glow: 'rgba(0,255,163,0.15)' },
  { from: 'var(--accent-warning)', to: 'var(--accent-danger)', glow: 'rgba(255,184,0,0.15)' },
];

export function GlobalStats({ className }: GlobalStatsProps) {
  const { chainId } = useChain();
  const { data, isLoading } = useQuery({
    queryKey: ['stats', chainId],
    queryFn: () => api.getStats(chainId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const stats = [
    {
      label: t('analytics.total_tvl'),
      value: (data?.total_tvl_usd ?? data?.total_tvl) != null ? formatUSD(data.total_tvl_usd ?? data.total_tvl) : '--',
      change: data?.tvl_change_24h,
    },
    {
      label: t('analytics.volume_24h'),
      value: (data?.volume_24h_usd ?? data?.volume_24h) != null ? formatUSD(data.volume_24h_usd ?? data.volume_24h) : '--',
      change: data?.volume_change_24h,
    },
    {
      label: t('analytics.total_pools'),
      value: data?.total_pools != null ? formatNumber(data.total_pools) : '--',
      change: null,
    },
    {
      label: t('analytics.total_txns'),
      value: (data?.total_transactions ?? data?.transactions_24h) != null ? formatNumber(data.total_transactions ?? data.transactions_24h) : '--',
      change: null,
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map((stat, idx) => {
        const Icon = STAT_ICONS[idx];
        const gradient = STAT_GRADIENTS[idx];

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
            className="card p-5"
          >
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 bg-[var(--bg-surface-2)] rounded-xl" />
                <div className="h-3 w-20 bg-[var(--bg-surface-2)] rounded" />
                <div className="h-7 w-28 bg-[var(--bg-surface-2)] rounded" />
              </div>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: `linear-gradient(135deg, ${gradient.from}22, ${gradient.to}11)`,
                    boxShadow: `0 0 16px ${gradient.glow}`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: gradient.from }} />
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">{stat.label}</p>
                <p
                  className="text-[28px] font-bold gradient-text tracking-tight"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {stat.value}
                </p>
                {stat.change != null && (
                  <p
                    className={cn(
                      'text-xs font-medium mt-1',
                      stat.change >= 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]'
                    )}
                  >
                    {stat.change >= 0 ? '+' : ''}
                    {stat.change.toFixed(2)}% {t('analytics.vs_24h')}
                  </p>
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
