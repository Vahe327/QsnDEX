'use client';

import { motion } from 'framer-motion';
import { Users, Coins, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { APRBadge } from './APRBadge';
import { PoolCountdown } from './PoolCountdown';
import type { StakingPoolInfo } from '@/hooks/useStakingPools';

interface StakingPoolCardProps {
  pool: StakingPoolInfo;
  index: number;
}

export function StakingPoolCard({ pool, index }: StakingPoolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/app/staking/pool/${pool.address}`}>
        <div
          className="card p-5 hover:scale-[1.01] transition-transform duration-200 cursor-pointer relative overflow-hidden"
          style={{ minHeight: '200px' }}
        >
          {pool.is_protocol && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(240, 180, 41, 0.2), rgba(240, 180, 41, 0.05))',
                border: '1px solid rgba(240, 180, 41, 0.4)',
                color: 'var(--accent-primary)',
                textShadow: '0 0 8px rgba(240, 180, 41, 0.4)',
              }}
            >
              <Shield className="w-3 h-3" />
              {t('staking_pools.protocol_badge')}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(240, 180, 41, 0.15), rgba(240, 180, 41, 0.05))',
                  border: '1px solid rgba(240, 180, 41, 0.2)',
                  color: 'var(--accent-primary)',
                  textShadow: '0 0 6px rgba(240, 180, 41, 0.3)',
                }}
              >
                {pool.stake_token_symbol?.slice(0, 3) ?? '?'}
              </div>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  textShadow: '0 0 6px rgba(99, 102, 241, 0.3)',
                }}
              >
                {pool.reward_token_symbol?.slice(0, 3) ?? '?'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}
              >
                {pool.stake_token_symbol ?? '???'} {'\u2192'} {pool.reward_token_symbol ?? '???'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.stake')}: {pool.stake_token_symbol ?? '???'}
              </p>
            </div>
            <APRBadge apr={pool.apr} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.tvl')}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  textShadow: '0 0 6px rgba(0,0,0,0.3)',
                }}
              >
                {formatUSD(pool.total_staked_usd)}
              </span>
            </div>
            <div>
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.stakers')}
              </span>
              <span
                className="text-sm font-semibold flex items-center gap-1"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  textShadow: '0 0 6px rgba(0,0,0,0.3)',
                }}
              >
                <Users className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                {formatNumber(pool.stakers_count)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.remaining')}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  textShadow: '0 0 6px rgba(0,0,0,0.3)',
                }}
              >
                {formatUSD(pool.remaining_rewards_usd)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <PoolCountdown periodFinish={pool.period_finish} />
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--accent-primary)', textShadow: '0 0 6px rgba(240, 180, 41, 0.3)' }}
            >
              {t('staking_pools.view_pool')}
              <Coins className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
