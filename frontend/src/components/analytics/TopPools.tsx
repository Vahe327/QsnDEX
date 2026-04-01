'use client';

import { motion } from 'framer-motion';
import { Droplets, ArrowUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { shortenAddress, getExplorerAddressUrl } from '@/lib/formatters';
import { TokenIcon } from '@/components/common/TokenIcon';
import { usePools } from '@/hooks/usePools';

interface TopPoolsProps {
  className?: string;
}

export function TopPools({ className }: TopPoolsProps) {
  const { pools, isLoading, sortField, sortOrder, toggleSort } = usePools({
    limit: 10,
    initialSort: 'tvl',
    initialOrder: 'desc',
  });

  const SortHeader = ({
    field,
    label,
    align = 'right',
  }: {
    field: 'tvl' | 'volume24h' | 'apr' | 'fee';
    label: string;
    align?: 'left' | 'right';
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors',
        align === 'right' && 'ml-auto'
      )}
    >
      {label}
      <ArrowUpDown
        className={cn(
          'w-3 h-3',
          sortField === field && 'text-[var(--accent-primary)]'
        )}
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'card overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
          <Droplets className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('analytics.top_pools')}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] w-8">#</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">
                {t('analytics.pool')}
              </th>
              <th className="px-3 py-3"><SortHeader field="tvl" label={t('pools.tvl')} /></th>
              <th className="px-3 py-3"><SortHeader field="volume24h" label={t('analytics.volume_24h')} /></th>
              <th className="px-3 py-3"><SortHeader field="apr" label={t('pools.apr')} /></th>
              <th className="px-3 py-3"><SortHeader field="fee" label={t('analytics.fee')} /></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]/50">
                    <td className="px-5 py-3.5" colSpan={6}>
                      <div className="h-5 bg-[var(--bg-surface-2)] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              : pools.map((pool: any, idx: number) => (
                  <motion.tr
                    key={pool.address || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-surface-3)]/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs text-[var(--text-tertiary)]">{idx + 1}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <TokenIcon address={pool.token0} symbol={pool.token0_symbol} size="xs" />
                          <TokenIcon address={pool.token1} symbol={pool.token1_symbol} size="xs" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {pool.token0_symbol}/{pool.token1_symbol}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[var(--text-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                              {shortenAddress(pool.address)}
                            </span>
                            <a
                              href={getExplorerAddressUrl(pool.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatUSD(pool.tvl_usd ?? pool.tvl)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-sm text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatUSD(pool.volume_24h_usd ?? pool.volume_24h)}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-medium text-[var(--accent-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatPercent(pool.apr_24h ?? pool.apr)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right text-sm text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {pool.fee != null ? (pool.fee / 10000).toFixed(2) + '%' : '0.30%'}
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
