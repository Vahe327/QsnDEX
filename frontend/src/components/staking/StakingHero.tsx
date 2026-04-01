'use client';

import { motion } from 'framer-motion';
import { Coins, TrendingUp, Percent, Gift } from 'lucide-react';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import type { StakingInfo } from '@/hooks/useQsnStaking';

interface StakingHeroProps {
  stakingInfo?: StakingInfo;
  isLoading: boolean;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, sub, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(240, 180, 41, 0.1)',
            border: '1px solid rgba(240, 180, 41, 0.2)',
          }}
        >
          <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <div>
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', color: 'var(--text-primary)' }}
        >
          {value}
        </span>
        {sub && (
          <span className="block text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {sub}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function StakingHero({ stakingInfo, isLoading }: StakingHeroProps) {
  const qsnPrice = stakingInfo?.qsn_price ?? 0;
  const totalStakedUsd = stakingInfo?.total_staked_usd ?? 0;
  const apy = stakingInfo?.apy ?? 0;
  const totalDistributedUsd = stakingInfo?.total_distributed_usd ?? 0;

  const loadingPlaceholder = isLoading ? '...' : '0';

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <h1
          className="text-3xl font-bold mb-2 gradient-text"
          style={{ display: 'inline-block' }}
        >
          {t('staking.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('staking.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Coins}
          label={t('staking.qsn_price')}
          value={isLoading ? loadingPlaceholder : formatUSD(qsnPrice)}
          delay={0}
        />
        <StatCard
          icon={TrendingUp}
          label={t('staking.total_staked')}
          value={isLoading ? loadingPlaceholder : formatUSD(totalStakedUsd)}
          sub={stakingInfo ? `${formatNumber(Number(stakingInfo.total_staked))} QSN` : undefined}
          delay={0.05}
        />
        <StatCard
          icon={Percent}
          label={t('staking.apy')}
          value={isLoading ? loadingPlaceholder : `${apy.toFixed(2)}%`}
          delay={0.1}
        />
        <StatCard
          icon={Gift}
          label={t('staking.total_distributed')}
          value={isLoading ? loadingPlaceholder : formatUSD(totalDistributedUsd)}
          sub={stakingInfo?.reward_token_symbol ?? 'WETH'}
          delay={0.15}
        />
      </div>
    </div>
  );
}
