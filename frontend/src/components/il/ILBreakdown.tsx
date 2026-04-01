'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Waves, Coins, TrendingUp, TrendingDown, Clock, ArrowRight } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface ILSimulationResponse {
  deposit_usd: number;
  price_change_pct: number;
  il_pct: number;
  il_usd: number;
  hodl_value: number;
  pool_value: number;
  fees_earned: number;
  net_value: number;
  net_pnl: number;
  breakeven_days: number;
  pool_apr: number;
  days_in_pool: number;
}

interface ILBreakdownProps {
  simulation: ILSimulationResponse;
  className?: string;
}

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatUsd(value)}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  index: number;
}

function StatCard({ icon, title, value, delta, deltaPositive, index }: StatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'card flex flex-col gap-3 p-4',
        'hover:border-[var(--accent-primary)]/20 transition-colors duration-200',
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: deltaPositive
              ? 'rgba(0, 255, 163, 0.1)'
              : 'rgba(255, 59, 92, 0.1)',
          }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span
          className="text-xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {value}
        </span>
        <span
          className={cn(
            'text-sm font-semibold',
            deltaPositive ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {delta}
        </span>
      </div>
    </motion.div>
  );
}

export function ILBreakdown({ simulation, className }: ILBreakdownProps) {
  const hodlPnl = useMemo(
    () => simulation.hodl_value - simulation.deposit_usd,
    [simulation],
  );

  const poolPnl = useMemo(
    () => simulation.pool_value - simulation.deposit_usd,
    [simulation],
  );

  const netVsHodl = useMemo(
    () => simulation.net_value - simulation.hodl_value,
    [simulation],
  );

  const netPositive = netVsHodl >= 0;

  const breakevenText = useMemo(() => {
    if (simulation.breakeven_days <= 0 || simulation.net_pnl >= 0) {
      return t('pools.already_profitable');
    }
    return t('pools.breakeven_in', { days: String(Math.ceil(simulation.breakeven_days)) });
  }, [simulation]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          index={0}
          icon={
            <Wallet
              size={16}
              className={cn(
                hodlPnl >= 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]',
              )}
            />
          }
          title={t('pools.just_hodl')}
          value={formatUsd(simulation.hodl_value)}
          delta={formatDelta(hodlPnl)}
          deltaPositive={hodlPnl >= 0}
        />

        <StatCard
          index={1}
          icon={
            <Waves
              size={16}
              className={cn(
                poolPnl >= 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-danger)]',
              )}
            />
          }
          title={t('pools.in_pool')}
          value={formatUsd(simulation.pool_value)}
          delta={`${formatDelta(poolPnl)} (IL: ${formatPct(-simulation.il_pct)})`}
          deltaPositive={poolPnl >= 0}
        />

        <StatCard
          index={2}
          icon={<Coins size={16} className="text-[var(--accent-tertiary)]" />}
          title={t('pools.fees_earned')}
          value={formatUsd(simulation.fees_earned)}
          delta={formatPct(simulation.pool_apr)}
          deltaPositive={true}
        />
      </div>

      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'card relative overflow-hidden p-5',
          netPositive
            ? 'border-[var(--accent-tertiary)]/30 bg-[var(--accent-tertiary)]/5'
            : 'border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5',
        )}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background: netPositive ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
          }}
        />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {netPositive ? (
              <TrendingUp size={20} className="text-[var(--accent-tertiary)]" />
            ) : (
              <TrendingDown size={20} className="text-[var(--accent-danger)]" />
            )}
            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {t('pools.net_result')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-secondary)]">
                {t('pools.pool_plus_fees')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatUsd(simulation.net_value)}
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold px-2 py-0.5 rounded-md',
                    simulation.net_pnl >= 0
                      ? 'text-[var(--accent-tertiary)] bg-[var(--accent-tertiary)]/10'
                      : 'text-[var(--accent-danger)] bg-[var(--accent-danger)]/10',
                  )}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatDelta(simulation.net_pnl)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-secondary)]">
                {t('pools.vs_hodl')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-2xl font-bold',
                    netPositive
                      ? 'text-[var(--accent-tertiary)]'
                      : 'text-[var(--accent-danger)]',
                  )}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatDelta(netVsHodl)}
                </span>
                <ArrowRight
                  size={16}
                  className={cn(
                    netPositive
                      ? 'text-[var(--accent-tertiary)]'
                      : 'text-[var(--accent-danger)]',
                  )}
                />
              </div>
            </div>
          </div>

          <div
            className={cn(
              'flex items-center gap-3 pt-3 border-t',
              netPositive
                ? 'border-[var(--accent-tertiary)]/15'
                : 'border-[var(--accent-danger)]/15',
            )}
          >
            <div
              className={cn(
                'flex-1 text-sm font-medium',
                netPositive
                  ? 'text-[var(--accent-tertiary)]'
                  : 'text-[var(--accent-danger)]',
              )}
            >
              {netPositive ? t('pools.earn_more_than_hodl') : t('pools.lose_vs_hodl')}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Clock size={12} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{breakevenText}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
