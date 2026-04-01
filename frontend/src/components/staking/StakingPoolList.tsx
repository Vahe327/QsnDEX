'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertTriangle, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { t } from '@/i18n';
import { useStakingPools, useUserStakingPositions } from '@/hooks/useStakingPools';
import { StakingPoolCard } from './StakingPoolCard';
import { StakingPoolFilters, type StakingPoolTab, type StakingPoolSort } from './StakingPoolFilters';

export function StakingPoolList() {
  const { address } = useAccount();
  const [tab, setTab] = useState<StakingPoolTab>('active');
  const [sort, setSort] = useState<StakingPoolSort>('apr');

  const statusFilter = tab === 'my' ? undefined : tab;
  const { pools, isLoading, error } = useStakingPools(statusFilter, sort);
  const { positions, isLoading: isLoadingPositions } = useUserStakingPositions();

  const displayPools = tab === 'my' ? positions : pools;
  const isLoadingCurrent = tab === 'my' ? isLoadingPositions : isLoading;

  const sortedPools = tab === 'active'
    ? [...displayPools].sort((a, b) => {
        if (a.is_protocol && !b.is_protocol) return -1;
        if (!a.is_protocol && b.is_protocol) return 1;
        return 0;
      })
    : displayPools;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-3xl font-bold mb-1 gradient-text"
            style={{ display: 'inline-block' }}
          >
            {t('staking_pools.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
            {t('staking_pools.subtitle')}
          </p>
        </div>
        <Link href="/app/staking/create">
          <button
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('staking_pools.create_pool')}
          </button>
        </Link>
      </motion.div>

      <StakingPoolFilters
        activeTab={tab}
        onTabChange={setTab}
        sort={sort}
        onSortChange={setSort}
      />

      {isLoadingCurrent && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )}

      {error && !isLoadingCurrent && (
        <div className="card p-8 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-danger, #ef4444)' }} />
          <p style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
            {t('staking_pools.error_loading')}
          </p>
        </div>
      )}

      {!isLoadingCurrent && !error && sortedPools.length === 0 && (
        <div className="card p-10 text-center">
          <Inbox className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
            {tab === 'my' ? t('staking_pools.no_my_stakes') : t('staking_pools.no_pools')}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
            {tab === 'my' ? t('staking_pools.no_my_stakes_desc') : t('staking_pools.no_pools_desc')}
          </p>
        </div>
      )}

      {!isLoadingCurrent && !error && sortedPools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedPools.map((pool, i) => (
            <StakingPoolCard key={pool.address} pool={pool} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
