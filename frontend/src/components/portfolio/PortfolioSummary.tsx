'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { usePortfolio } from '@/hooks/usePortfolio';

interface PortfolioSummaryProps {
  className?: string;
}

export function PortfolioSummary({ className }: PortfolioSummaryProps) {
  const { portfolio, isLoading, isConnected } = usePortfolio();

  const totalValue = portfolio?.total_value_usd ?? 0;
  const change24h = portfolio?.change_24h ?? 0;
  const changePercent24h = portfolio?.change_percent_24h ?? 0;
  const isPositive = change24h >= 0;

  if (!isConnected) {
    return (
      <div className={cn('card p-6', className)}>
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--gradient-glow)',
              boxShadow: '0 0 20px rgba(0,229,255,0.1)',
            }}
          >
            <Wallet className="w-6 h-6 text-[var(--accent-primary)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{t('portfolio.connect_wallet')}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('card p-6', className)}>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-24 bg-[var(--bg-surface-2)] rounded" />
          <div className="h-8 w-40 bg-[var(--bg-surface-2)] rounded" />
          <div className="h-4 w-32 bg-[var(--bg-surface-2)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('card p-6', className)}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(123,97,255,0.1))',
            boxShadow: '0 0 12px rgba(0,229,255,0.1)',
          }}
        >
          <Wallet className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {t('portfolio.total_value')}
        </span>
      </div>

      <div className="mb-2">
        <span
          className="text-3xl font-bold gradient-text tracking-tight"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatUSD(totalValue)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold',
            isPositive
              ? 'bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)]'
              : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {formatPercent(Math.abs(changePercent24h))}
        </div>
        <span
          className={cn('text-xs', isPositive ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]')}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {isPositive ? '+' : ''}{formatUSD(change24h)}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">{t('portfolio.24h')}</span>
      </div>
    </motion.div>
  );
}
