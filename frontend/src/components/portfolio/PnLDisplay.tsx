'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { usePortfolio } from '@/hooks/usePortfolio';

interface PnLDisplayProps {
  className?: string;
}

export function PnLDisplay({ className }: PnLDisplayProps) {
  const { portfolio, isLoading, isConnected } = usePortfolio();

  const pnl = portfolio?.pnl ?? { total_usd: 0, percent: 0, realized: 0, unrealized: 0 };
  const isPositive = pnl.total_usd > 0;
  const isNeutral = pnl.total_usd === 0;

  if (!isConnected) return null;

  if (isLoading) {
    return (
      <div className={cn('card p-6', className)}>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-24 bg-[var(--bg-surface-2)] rounded" />
          <div className="h-7 w-32 bg-[var(--bg-surface-2)] rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-20 bg-[var(--bg-surface-2)] rounded" />
            <div className="h-4 w-20 bg-[var(--bg-surface-2)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn('card p-6', className)}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,229,255,0.1))',
            boxShadow: '0 0 12px rgba(123,97,255,0.1)',
          }}
        >
          <BarChart3 className="w-4 h-4 text-[var(--accent-secondary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {t('portfolio.pnl')}
        </span>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span
          className={cn(
            'text-2xl font-bold tracking-tight',
            isNeutral
              ? 'text-[var(--text-primary)]'
              : isPositive
                ? 'text-[var(--accent-tertiary)]'
                : 'text-[var(--accent-danger)]',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {isPositive ? '+' : ''}{formatUSD(pnl.total_usd)}
        </span>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold mb-0.5',
            isNeutral
              ? 'bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]'
              : isPositive
                ? 'bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)]'
                : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
          )}
        >
          {isNeutral ? (
            <Minus className="w-3 h-3" />
          ) : isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {formatPercent(Math.abs(pnl.percent))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-3">
          <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">
            {t('portfolio.realized')}
          </span>
          <span
            className={cn(
              'text-sm font-semibold',
              pnl.realized >= 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]',
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {pnl.realized >= 0 ? '+' : ''}{formatUSD(pnl.realized)}
          </span>
        </div>
        <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-3">
          <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">
            {t('portfolio.unrealized')}
          </span>
          <span
            className={cn(
              'text-sm font-semibold',
              pnl.unrealized >= 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]',
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {pnl.unrealized >= 0 ? '+' : ''}{formatUSD(pnl.unrealized)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
