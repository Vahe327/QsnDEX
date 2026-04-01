'use client';

import { motion } from 'framer-motion';
import { Users, Clock, BarChart3, Coins } from 'lucide-react';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import type { StakingInfo } from '@/hooks/useQsnStaking';

interface StakingStatsProps {
  stakingInfo?: StakingInfo;
  isLoading: boolean;
}

export function StakingStats({ stakingInfo, isLoading }: StakingStatsProps) {
  const stakersCount = stakingInfo?.stakers_count ?? 0;
  const totalDistributed = stakingInfo?.total_distributed ?? '0';
  const totalDistributedUsd = stakingInfo?.total_distributed_usd ?? 0;
  const frequency = stakingInfo?.distribution_frequency ?? '-';
  const rewardSymbol = stakingInfo?.reward_token_symbol ?? 'WETH';

  const placeholder = isLoading ? '...' : '-';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="card p-6 mt-6"
    >
      <h2
        className="text-lg font-semibold mb-5"
        style={{ color: 'var(--text-primary)' }}
      >
        {t('staking.global_stats')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(240, 180, 41, 0.08)',
              border: '1px solid rgba(240, 180, 41, 0.15)',
            }}
          >
            <Users className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
              {t('staking.stakers_count')}
            </span>
            <span
              className="text-lg font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {isLoading ? placeholder : formatNumber(stakersCount)}
            </span>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(240, 180, 41, 0.08)',
              border: '1px solid rgba(240, 180, 41, 0.15)',
            }}
          >
            <Coins className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
              {t('staking.total_distributed')}
            </span>
            <span
              className="text-lg font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {isLoading ? placeholder : `${formatNumber(Number(totalDistributed))} ${rewardSymbol}`}
            </span>
            <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
              {isLoading ? '' : formatUSD(totalDistributedUsd)}
            </span>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(240, 180, 41, 0.08)',
              border: '1px solid rgba(240, 180, 41, 0.15)',
            }}
          >
            <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
              {t('staking.distribution_frequency')}
            </span>
            <span
              className="text-lg font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {isLoading ? placeholder : frequency}
            </span>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(240, 180, 41, 0.08)',
              border: '1px solid rgba(240, 180, 41, 0.15)',
            }}
          >
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
              {t('staking.apy')}
            </span>
            <span
              className="text-lg font-bold"
              style={{
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {isLoading ? placeholder : `${(stakingInfo?.apy ?? 0).toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
