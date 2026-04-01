'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Tractor, TrendingUp, Loader2 } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChain } from '@/hooks/useChain';
import { PoolPairIcon } from '@/components/pools/PoolPairIcon';

type FarmFilter = 'all' | 'active' | 'my';

export function MobileFarms() {
  const { chainId } = useChain();
  const [filter, setFilter] = useState<FarmFilter>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['farms', chainId],
    queryFn: () => api.getFarms(chainId),
    staleTime: 30_000,
  });

  const farms = data?.farms ?? [];

  const filtered = useMemo(() => {
    let result = farms;
    if (filter === 'active') {
      result = result.filter((f: any) => f.active);
    } else if (filter === 'my') {
      result = result.filter((f: any) => f.your_staked_usd && f.your_staked_usd > 0);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f: any) =>
          f.token0_symbol?.toLowerCase().includes(q) ||
          f.token1_symbol?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [farms, filter, search]);

  return (
    <div className="px-3 pt-3 pb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))' }}
        >
          <Tractor className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
            {t('farms.title')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('farms.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
        {(['all', 'active', 'my'] as FarmFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[32px]',
              filter === f ? 'text-white' : 'text-[var(--text-tertiary)]'
            )}
            style={
              filter === f
                ? { background: 'var(--gradient-primary)' }
                : { background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }
            }
          >
            {t(`farms.filter_${f}`)}
          </button>
        ))}
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder={t('farms.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <Tractor className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--accent-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('farms.no_farms')}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((farm: any, i: number) => (
            <motion.div
              key={farm.id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <PoolPairIcon
                    token0Symbol={farm.token0_symbol}
                    token1Symbol={farm.token1_symbol}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {farm.token0_symbol}/{farm.token1_symbol}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {t('farms.earn')} {farm.reward_token_symbol}
                    </div>
                  </div>
                </div>
                {farm.multiplier && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--gradient-glow)', color: 'var(--accent-primary)', border: '1px solid var(--border-glow)' }}
                  >
                    {farm.multiplier}x
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    {t('farms.apr')}
                  </div>
                  <div
                    className="text-sm font-bold font-[var(--font-mono)]"
                    style={{ color: farm.apr > 10 ? 'var(--accent-tertiary)' : 'var(--text-primary)' }}
                  >
                    {formatPercent(farm.apr)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    {t('farms.total_staked')}
                  </div>
                  <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                    {formatUSD(farm.total_staked_usd)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    {t('farms.earned')}
                  </div>
                  <div className="text-sm font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                    {farm.pending_rewards_usd ? formatUSD(farm.pending_rewards_usd) : '-'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold min-h-[40px]"
                  style={{ background: 'var(--gradient-primary)', color: '#000' }}
                >
                  {t('farms.stake')}
                </button>
                {farm.your_staked_usd > 0 && (
                  <button
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold min-h-[40px]"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                  >
                    {t('farms.claim')}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
