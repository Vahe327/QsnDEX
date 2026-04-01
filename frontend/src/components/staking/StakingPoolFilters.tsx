'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

export type StakingPoolTab = 'active' | 'ended' | 'my';
export type StakingPoolSort = 'apr' | 'tvl' | 'newest';

interface StakingPoolFiltersProps {
  activeTab: StakingPoolTab;
  onTabChange: (tab: StakingPoolTab) => void;
  sort: StakingPoolSort;
  onSortChange: (sort: StakingPoolSort) => void;
}

export function StakingPoolFilters({ activeTab, onTabChange, sort, onSortChange }: StakingPoolFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  const tabs: { key: StakingPoolTab; label: string }[] = [
    { key: 'active', label: t('staking_pools.tab_active') },
    { key: 'ended', label: t('staking_pools.tab_ended') },
    { key: 'my', label: t('staking_pools.tab_my_stakes') },
  ];

  const sortOptions: { key: StakingPoolSort; label: string }[] = [
    { key: 'apr', label: t('staking_pools.sort_apr') },
    { key: 'tvl', label: t('staking_pools.sort_tvl') },
    { key: 'newest', label: t('staking_pools.sort_newest') },
  ];

  const currentSortLabel = sortOptions.find((o) => o.key === sort)?.label ?? 'APR';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div
        className="input-sunken flex rounded-xl p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))'
                : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.key
                ? '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
                : 'none',
              textShadow: activeTab === tab.key
                ? '0 0 8px rgba(240,180,41,0.3), 0 1px 1px rgba(0,0,0,0.5)'
                : '0 1px 1px rgba(0,0,0,0.3)',
              border: activeTab === tab.key ? '1px solid rgba(240,180,41,0.15)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative" ref={sortRef}>
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: 'var(--text-tertiary)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
          >
            {t('staking_pools.sort_by')}:
          </span>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, var(--bg-surface) 100%)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
              textShadow: '0 1px 1px rgba(0,0,0,0.4)',
            }}
          >
            {currentSortLabel}
            <ChevronDown
              className={cn('w-3.5 h-3.5 transition-transform duration-200', sortOpen && 'rotate-180')}
              style={{ color: 'var(--text-tertiary)' }}
            />
          </button>
        </div>

        <AnimatePresence>
          {sortOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl overflow-hidden py-1"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    onSortChange(opt.key);
                    setSortOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                  style={{
                    color: sort === opt.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: sort === opt.key ? 'rgba(240,180,41,0.05)' : 'transparent',
                    textShadow: sort === opt.key
                      ? '0 0 8px rgba(240,180,41,0.2), 0 1px 1px rgba(0,0,0,0.4)'
                      : '0 1px 1px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (sort !== opt.key) e.currentTarget.style.background = 'rgba(240,180,41,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (sort !== opt.key) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{opt.label}</span>
                  {sort === opt.key && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
