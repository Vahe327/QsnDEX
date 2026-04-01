'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { SaleStatusBadge } from './SaleStatusBadge';
import { SaleProgress } from './SaleProgress';
import { SaleCountdown } from './SaleCountdown';
import type { LaunchpadSale } from '@/hooks/useLaunchpad';
import { useChain } from '@/hooks/useChain';

interface SaleCardProps {
  sale: LaunchpadSale;
  index: number;
}

export function SaleCard({ sale, index }: SaleCardProps) {
  const countdownTarget = sale.status === 'upcoming' ? sale.start_time : sale.end_time;
  const countdownLabel =
    sale.status === 'upcoming'
      ? t('launchpad.starts_in')
      : sale.status === 'active'
        ? t('launchpad.ends_in')
        : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link href={`/app/launchpad/${sale.id}`} className="block">
        <div className="card p-5 hover:border-[var(--border-glow)] transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3
                className="text-base font-semibold group-hover:text-[var(--accent-primary)] transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {sale.sale_name || sale.token_name || sale.token_symbol}
              </h3>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {sale.token_symbol}{sale.token_name && sale.sale_name ? ` · ${sale.token_name}` : ''}
              </span>
            </div>
            <SaleStatusBadge status={sale.status} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('launchpad.token_price')}
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {parseFloat(sale.price) > 0 ? `${formatNumber(parseFloat(sale.price))} ETH` : formatUSD(sale.price_usd)}
            </span>
          </div>

          <div className="mb-4">
            <SaleProgress
              raised={sale.total_raised}
              softCap={sale.soft_cap}
              hardCap={sale.hard_cap}
              symbol="ETH"
            />
          </div>

          <div className="flex items-end justify-between">
            {sale.status !== 'ended' ? (
              <SaleCountdown targetTimestamp={countdownTarget} label={countdownLabel} />
            ) : (
              <div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {t('launchpad.total_raised_label')}
                </span>
                <span
                  className="text-sm font-semibold block"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  }}
                >
                  {formatNumber(Number(sale.total_raised))} ETH
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                <span
                  className="text-sm font-medium"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  }}
                >
                  {sale.participants}
                </span>
              </div>
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
