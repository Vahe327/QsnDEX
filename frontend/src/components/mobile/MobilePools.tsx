'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Plus, Droplets, TrendingUp, ChevronRight } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { usePools } from '@/hooks/usePools';
import { PoolPairIcon } from '@/components/pools/PoolPairIcon';
import { MyPositions } from '@/components/pools/MyPositions';
import { Skeleton } from '@/components/common/Skeleton';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';

function feeBpsToLabel(fee: number): string {
  if (fee <= 100) return '0.01%';
  if (fee <= 500) return '0.05%';
  if (fee <= 3000) return '0.30%';
  return '1.00%';
}

export function MobilePools() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'my'>('all');
  const {
    pools: filteredPools,
    isLoading,
    searchQuery,
    setSearchQuery,
    sortField,
    toggleSort,
  } = usePools();

  return (
    <div className="px-3 pt-3 pb-4">
      <NetworkSwitcher />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h1
            className="text-xl font-bold font-[var(--font-heading)]"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('pools.title')}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t('pools.subtitle')}
          </p>
        </div>
        <button
          onClick={() => router.push('/app/pools/create')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold min-h-[44px]"
          style={{
            background: 'var(--gradient-primary)',
            color: '#fff',
            boxShadow: 'var(--glow-gold)',
          }}
        >
          <Plus className="w-4 h-4" />
          {t('pools.create_pool')}
        </button>
      </div>

      <div
        className="flex gap-1 p-1 rounded-xl mb-3"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
      >
        {(['all', 'my'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px]',
              tab === tabKey
                ? 'text-white'
                : 'text-[var(--text-tertiary)]'
            )}
            style={
              tab === tabKey
                ? { background: 'var(--gradient-primary)' }
                : undefined
            }
          >
            {tabKey === 'all' ? t('pools.all_pools') : t('pools.my_positions')}
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        <>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder={t('common.search_tokens')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
            {[
              { key: 'tvl' as const, label: t('pools.tvl') },
              { key: 'volume24h' as const, label: t('pools.volume_24h') },
              { key: 'apr' as const, label: t('pools.apr') },
            ].map((sort) => (
              <button
                key={sort.key}
                onClick={() => toggleSort(sort.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[32px]',
                  sortField === sort.key
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-tertiary)]'
                )}
                style={{
                  background: sortField === sort.key ? 'var(--gradient-glow)' : 'var(--bg-surface-2)',
                  border: `1px solid ${sortField === sort.key ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                }}
              >
                {sort.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <Skeleton className="h-16" />
                </div>
              ))}
            </div>
          ) : filteredPools.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <Droplets className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('pools.no_pools')}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPools.map((pool: any, i: number) => (
                <motion.button
                  key={pool.address}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  onClick={() => router.push(`/app/pools/${pool.address}`)}
                  className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <PoolPairIcon
                        token0Symbol={pool.token0_symbol}
                        token1Symbol={pool.token1_symbol}
                        token0Logo={pool.token0_logo}
                        token1Logo={pool.token1_logo}
                        size="sm"
                      />
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {pool.token0_symbol}/{pool.token1_symbol}
                        </div>
                        <div
                          className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block font-mono"
                          style={{
                            background: 'var(--bg-surface-3)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {feeBpsToLabel(pool.fee)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {t('pools.tvl')}
                      </div>
                      <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                        {formatUSD(pool.tvl)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {t('pools.volume_24h')}
                      </div>
                      <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                        {formatUSD(pool.volume_24h)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {t('pools.apr')}
                      </div>
                      <div
                        className="text-sm font-bold font-[var(--font-mono)]"
                        style={{ color: pool.apr > 10 ? 'var(--accent-tertiary)' : 'var(--text-primary)' }}
                      >
                        {pool.apr > 10 && <TrendingUp className="w-3 h-3 inline mr-0.5" />}
                        {formatPercent(pool.apr)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      ) : (
        <MyPositions />
      )}
    </div>
  );
}
