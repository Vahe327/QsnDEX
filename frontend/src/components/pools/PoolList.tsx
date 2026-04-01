'use client';

import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePools } from '@/hooks/usePools';
import { PoolRow } from './PoolRow';
import { Skeleton } from '@/components/common/Skeleton';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface PoolListProps {
  className?: string;
}

type SortField = 'tvl' | 'volume24h' | 'apr' | 'fee';

interface SortIconProps {
  field: SortField;
  currentField: SortField;
  currentOrder: 'asc' | 'desc';
}

function SortIcon({ field, currentField, currentOrder }: SortIconProps) {
  if (field !== currentField) {
    return <ChevronDown size={14} className="opacity-30" />;
  }
  return currentOrder === 'asc' ? (
    <ChevronUp size={14} className="text-[var(--accent-primary)]" />
  ) : (
    <ChevronDown size={14} className="text-[var(--accent-primary)]" />
  );
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3 },
  }),
};

export function PoolList({ className }: PoolListProps) {
  const {
    pools,
    isLoading,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    page,
    setPage,
    totalPages,
  } = usePools();

  const columns: { field: SortField; label: string }[] = [
    { field: 'tvl', label: t('pools.tvl') },
    { field: 'apr', label: t('pools.apr') },
    { field: 'volume24h', label: t('pools.volume') },
  ];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('common.search_tokens')}
          className="input-field pl-10"
        />
      </div>

      <div
        className={cn(
          'hidden sm:block overflow-x-auto rounded-[20px]',
          'bg-surface-alpha backdrop-blur-xl',
          'border border-[var(--border-subtle)]',
          'shadow-[var(--shadow-md)]',
        )}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                {t('analytics.pool')}
              </th>
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => toggleSort(col.field)}
                  className="px-5 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.field} currentField={sortField as SortField} currentOrder={sortOrder} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-3" colSpan={4}>
                    <Skeleton variant="row" height={40} />
                  </td>
                </tr>
              ))
            ) : pools.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                      <Droplets size={28} className="text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t('pools.no_pools')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pools.map((pool: any, idx: number) => (
                <motion.tr
                  key={pool.address}
                  custom={idx}
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                  className="contents"
                >
                  <PoolRow pool={pool} />
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {isLoading ? (
          <Skeleton variant="card" count={3} />
        ) : pools.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <Droplets size={28} className="text-[var(--text-tertiary)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('pools.no_pools')}
            </p>
          </div>
        ) : (
          pools.map((pool: any, idx: number) => (
            <motion.div
              key={pool.address}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <PoolRow pool={pool} />
            </motion.div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-30"
          >
            {t('pools.prev')}
          </button>
          <span className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-30"
          >
            {t('pools.next')}
          </button>
        </div>
      )}
    </div>
  );
}
