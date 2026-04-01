'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FarmCard } from './FarmCard';
import { StakeModal } from './StakeModal';
import { ClaimRewards } from './ClaimRewards';

interface FarmListProps {
  className?: string;
}

type FilterMode = 'all' | 'active' | 'my';

export function FarmList({ className }: FarmListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('active');
  const [stakeTarget, setStakeTarget] = useState<any | null>(null);
  const [claimTarget, setClaimTarget] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.getFarms(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const farms = data?.farms ?? [];

  const filtered = useMemo(() => {
    let result = farms;
    if (filter === 'active') result = result.filter((f: any) => f.active);
    if (filter === 'my') result = result.filter((f: any) => (f.your_staked_usd ?? 0) > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f: any) =>
          f.token0_symbol?.toLowerCase().includes(q) ||
          f.token1_symbol?.toLowerCase().includes(q) ||
          f.reward_token_symbol?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [farms, filter, search]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,163,0.15), rgba(0,229,255,0.1))',
              boxShadow: '0 0 12px rgba(0,255,163,0.1)',
            }}
          >
            <Sprout className="w-4 h-4 text-[var(--accent-tertiary)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {t('farms.title')}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">{t('farms.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('farms.search')}
              className={cn(
                'w-full pl-9 pr-3 py-2 rounded-xl',
                'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
                'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'focus:border-[var(--border-active)] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.06)]',
                'focus:outline-none transition-all duration-200',
              )}
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-subtle)]">
            {(['all', 'active', 'my'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  filter === mode
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,229,255,0.08)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                {t(`farms.filter_${mode}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)]" />
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)]" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-[var(--bg-surface-2)] rounded" />
                  <div className="h-3 w-16 bg-[var(--bg-surface-2)] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 bg-gradient-to-br from-[var(--accent-tertiary)]/15 to-[var(--accent-primary)]/15 flex items-center justify-center">
            <Sprout className="w-7 h-7 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{t('farms.no_farms')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((farm: any, idx: number) => (
            <FarmCard
              key={farm.id || farm.pool_address || idx}
              farm={farm}
              onStake={(f) => setStakeTarget(f)}
              onClaim={(f) => setClaimTarget(f)}
            />
          ))}
        </div>
      )}

      {stakeTarget && (
        <StakeModal
          farm={stakeTarget}
          onClose={() => setStakeTarget(null)}
        />
      )}
      {claimTarget && (
        <ClaimRewards
          farm={claimTarget}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}
