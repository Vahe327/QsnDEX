'use client';

import { motion } from 'framer-motion';
import { Coins, ArrowUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { formatUSD, formatPercent } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import { shortenAddress, getExplorerAddressUrl } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface TopTokensProps {
  className?: string;
}

type SortField = 'volume' | 'price' | 'change';

export function TopTokens({ className }: TopTokensProps) {
  const { chainId } = useChain();
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['tokens', chainId],
    queryFn: () => api.getTokens(undefined, chainId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const tokens = (data?.tokens ?? [])
    .sort((a: any, b: any) => {
      const fieldMap: Record<SortField, string> = {
        volume: 'volume_24h',
        price: 'price_usd',
        change: 'change_24h',
      };
      const field = fieldMap[sortField];
      const aVal = a[field] ?? 0;
      const bVal = b[field] ?? 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    })
    .slice(0, 10);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 ml-auto text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
    >
      {label}
      <ArrowUpDown className={cn('w-3 h-3', sortField === field && 'text-[var(--accent-primary)]')} />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className={cn(
        'card overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center">
          <Coins className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('analytics.top_tokens')}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] w-8">#</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">
                {t('analytics.token')}
              </th>
              <th className="px-3 py-3"><SortHeader field="price" label={t('analytics.price')} /></th>
              <th className="px-3 py-3"><SortHeader field="change" label="24h" /></th>
              <th className="px-3 py-3"><SortHeader field="volume" label={t('analytics.volume')} /></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]/50">
                    <td className="px-5 py-3.5" colSpan={5}>
                      <div className="h-5 bg-[var(--bg-surface-2)] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              : tokens.map((token: any, idx: number) => (
                  <motion.tr
                    key={token.address || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-surface-3)]/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs text-[var(--text-tertiary)]">{idx + 1}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <TokenIcon address={token.address} symbol={token.symbol || '?'} logoURI={token.logo_url} size="md" />
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{token.symbol}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[var(--text-tertiary)]">{token.name}</span>
                            <a
                              href={getExplorerAddressUrl(token.address)}
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
                      {formatUSD(token.price_usd)}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          (token.change_24h ?? 0) >= 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]'
                        )}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {(token.change_24h ?? 0) >= 0 ? '+' : ''}
                        {formatPercent(token.change_24h ?? 0)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right text-sm text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatUSD(token.volume_24h)}
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
