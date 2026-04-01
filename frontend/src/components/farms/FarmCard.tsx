'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatUSD, formatPercent, formatNumber } from '@/lib/formatters';

interface Farm {
  id: string;
  pool_address: string;
  token0_symbol: string;
  token1_symbol: string;
  reward_token_symbol: string;
  apr: number;
  total_staked_usd: number;
  your_staked_usd?: number;
  your_staked_lp?: number;
  pending_rewards?: number;
  pending_rewards_usd?: number;
  multiplier?: string;
  active: boolean;
}

interface FarmCardProps {
  farm: Farm;
  onStake?: (farm: Farm) => void;
  onClaim?: (farm: Farm) => void;
  className?: string;
}

export function FarmCard({ farm, onStake, onClaim, className }: FarmCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasPosition = (farm.your_staked_usd ?? 0) > 0;
  const hasPending = (farm.pending_rewards ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'card overflow-hidden',
        'hover:border-[var(--border-glow)]',
        !farm.active && 'opacity-60',
        className,
      )}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center ring-2 ring-[var(--bg-surface)] border border-[var(--border-glow)]">
                <span className="text-[9px] font-bold text-[var(--accent-primary)]">
                  {farm.token0_symbol?.slice(0, 2)}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--accent-secondary)]/15 flex items-center justify-center ring-2 ring-[var(--bg-surface)] border border-[var(--border-glow)]">
                <span className="text-[9px] font-bold text-[var(--accent-secondary)]">
                  {farm.token1_symbol?.slice(0, 2)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {farm.token0_symbol}/{farm.token1_symbol}
                </span>
                {farm.multiplier && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[10px] font-bold text-[var(--accent-primary)] shadow-[0_0_6px_rgba(0,229,255,0.08)]">
                    {farm.multiplier}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {t('farms.earn')} {farm.reward_token_symbol}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-[var(--text-tertiary)]">{t('farms.apr')}</p>
              <p
                className="text-sm font-bold gradient-text"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {formatPercent(farm.apr)}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-[var(--text-tertiary)]">{t('farms.total_staked')}</p>
              <p className="text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatUSD(farm.total_staked_usd)}
              </p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 sm:hidden">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[var(--accent-tertiary)]" />
            <span className="text-xs font-semibold text-[var(--accent-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatPercent(farm.apr)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatUSD(farm.total_staked_usd)}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-[var(--border-subtle)]"
        >
          <div className="px-5 py-4 space-y-4">
            {hasPosition && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-3">
                  <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">
                    {t('farms.your_staked')}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(farm.your_staked_usd ?? 0)}
                  </span>
                </div>
                <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-3">
                  <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">
                    {t('farms.pending_rewards')}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-[var(--accent-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(farm.pending_rewards ?? 0)}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {farm.reward_token_symbol}
                    </span>
                  </div>
                  {farm.pending_rewards_usd != null && (
                    <span className="text-[10px] text-[var(--text-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                      ~{formatUSD(farm.pending_rewards_usd)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => onStake?.(farm)}
                disabled={!farm.active}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                  'text-sm font-bold transition-all duration-200',
                  farm.active
                    ? 'text-[var(--bg-deep)] active:scale-[0.98]'
                    : 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] cursor-not-allowed',
                )}
                style={farm.active ? {
                  background: 'var(--gradient-primary)',
                  boxShadow: '0 4px 16px rgba(0,229,255,0.2)',
                } : undefined}
              >
                <Sprout className="w-4 h-4" />
                {hasPosition ? t('farms.manage') : t('farms.stake')}
              </button>

              {hasPending && (
                <button
                  onClick={() => onClaim?.(farm)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                    'bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)] text-sm font-bold',
                    'border border-[var(--accent-tertiary)]/20',
                    'hover:bg-[var(--accent-tertiary)]/20 hover:shadow-[0_0_12px_rgba(0,255,163,0.1)]',
                    'active:scale-[0.98] transition-all duration-200',
                  )}
                >
                  {t('farms.claim')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
