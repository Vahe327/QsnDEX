'use client';

import { motion } from 'framer-motion';
import { Coins, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { getExplorerAddressUrl } from '@/lib/formatters';
import { usePortfolio } from '@/hooks/usePortfolio';

interface TokenBalancesProps {
  className?: string;
}

export function TokenBalances({ className }: TokenBalancesProps) {
  const { portfolio, isLoading, isConnected } = usePortfolio();

  const tokens: any[] = portfolio?.token_balances ?? portfolio?.tokens ?? [];

  if (!isConnected) return null;

  if (isLoading) {
    return (
      <div className={cn('card overflow-hidden', className)}>
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="h-5 w-28 bg-[var(--bg-surface-2)] rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-16 bg-[var(--bg-surface-2)] rounded" />
                <div className="h-3 w-24 bg-[var(--bg-surface-2)] rounded" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 bg-[var(--bg-surface-2)] rounded" />
                <div className="h-3 w-14 bg-[var(--bg-surface-2)] rounded" />
              </div>
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
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'card overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('portfolio.token_balances')}</h3>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {tokens.length} {t('portfolio.tokens')}
        </span>
      </div>

      {tokens.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Coins className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
          <p className="text-sm text-[var(--text-secondary)]">{t('portfolio.no_tokens')}</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]/50">
          {tokens.map((token: any, idx: number) => (
            <motion.div
              key={token.address || idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-surface-3)]/40 transition-colors"
            >
              <TokenIcon address={token.address} symbol={token.symbol || '?'} logoURI={token.logo_url} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{token.symbol}</span>
                  {token.address && (
                    <a
                      href={getExplorerAddressUrl(token.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{token.name}</span>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatNumber(token.balance_formatted ?? token.balance)}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatUSD(token.value_usd)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
