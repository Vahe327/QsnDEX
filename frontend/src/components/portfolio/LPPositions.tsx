'use client';

import { motion } from 'framer-motion';
import { Droplets, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatNumber, formatPercent } from '@/lib/formatters';
import { getExplorerAddressUrl } from '@/lib/formatters';
import { usePortfolio } from '@/hooks/usePortfolio';

interface LPPositionsProps {
  className?: string;
}

export function LPPositions({ className }: LPPositionsProps) {
  const { portfolio, isLoading, isConnected } = usePortfolio();

  const positions: any[] = portfolio?.lp_positions ?? [];

  if (!isConnected) return null;

  if (isLoading) {
    return (
      <div className={cn('card overflow-hidden', className)}>
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="h-5 w-32 bg-[var(--bg-surface-2)] rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 animate-pulse space-y-2">
              <div className="h-4 w-24 bg-[var(--bg-surface-2)] rounded" />
              <div className="h-3 w-40 bg-[var(--bg-surface-2)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn(
        'card overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center">
            <Droplets className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('portfolio.lp_positions')}</h3>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {positions.length} {t('portfolio.positions')}
        </span>
      </div>

      {positions.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Droplets className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
          <p className="text-sm text-[var(--text-secondary)]">{t('portfolio.no_lp')}</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]/50">
          {positions.map((pos: any, idx: number) => (
            <motion.div
              key={pos.pool_address || idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="px-5 py-4 hover:bg-[var(--bg-surface-3)]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center ring-2 ring-[var(--bg-surface)] border border-[var(--border-glow)]">
                      <span className="text-[8px] font-bold text-[var(--accent-primary)]">
                        {pos.token0_symbol?.slice(0, 2)}
                      </span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-secondary)]/15 flex items-center justify-center ring-2 ring-[var(--bg-surface)] border border-[var(--border-glow)]">
                      <span className="text-[8px] font-bold text-[var(--accent-secondary)]">
                        {pos.token1_symbol?.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {pos.token0_symbol}/{pos.token1_symbol}
                  </span>
                  {pos.pool_address && (
                    <a
                      href={getExplorerAddressUrl(pos.pool_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatUSD(pos.value_usd)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">{t('portfolio.lp_share')}</span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatPercent(pos.share_percent ?? 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">{pos.token0_symbol}</span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(pos.token0_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">{pos.token1_symbol}</span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(pos.token1_amount)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
