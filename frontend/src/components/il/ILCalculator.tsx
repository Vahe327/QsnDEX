'use client';

import { useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Loader2,
  Droplets,
  Search,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useILCalculator } from '@/hooks/useILCalculator';
import { ILSlider } from './ILSlider';
import { ILBreakdown } from './ILBreakdown';
import { ILChart } from './ILChart';

interface ILCalculatorProps {
  poolAddress?: string;
  poolName?: string;
  poolApr?: number;
  className?: string;
}

const NUMBER_REGEX = /^[0-9]*[.]?[0-9]*$/;

export function ILCalculator({
  poolAddress: initialPoolAddress,
  poolName,
  poolApr,
  className,
}: ILCalculatorProps) {
  const [poolInput, setPoolInput] = useState(initialPoolAddress ?? '');
  const [depositInput, setDepositInput] = useState('1000');
  const [daysInput, setDaysInput] = useState('30');
  const [priceChangePct, setPriceChangePct] = useState(0);

  const poolAddress = useMemo(() => {
    const addr = initialPoolAddress ?? poolInput;
    if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return addr;
    return undefined;
  }, [initialPoolAddress, poolInput]);

  const depositUsd = useMemo(() => {
    const val = parseFloat(depositInput);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [depositInput]);

  const daysInPool = useMemo(() => {
    const val = parseInt(daysInput, 10);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [daysInput]);

  const { data: simulation, isLoading } = useILCalculator(
    poolAddress,
    depositUsd,
    priceChangePct,
    daysInPool,
  );

  const handleDepositChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '.');
    if (raw === '' || raw === '.') {
      setDepositInput(raw);
      return;
    }
    if (!NUMBER_REGEX.test(raw)) return;
    const dotIdx = raw.indexOf('.');
    if (dotIdx !== -1 && raw.length - dotIdx - 1 > 2) return;
    setDepositInput(raw);
  }, []);

  const handleDaysChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') {
      setDaysInput('');
      return;
    }
    const val = parseInt(raw, 10);
    if (val > 3650) return;
    setDaysInput(raw);
  }, []);

  const handlePoolInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPoolInput(e.target.value.trim());
  }, []);

  const priceRatio = useMemo(() => 1 + priceChangePct / 100, [priceChangePct]);

  const showPoolInput = !initialPoolAddress;

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <Calculator size={20} className="text-[var(--bg-surface)]" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {t('pools.il_calculator')}
          </h2>
          {poolName && poolApr !== undefined ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">{poolName}</span>
              <span className="text-[var(--accent-tertiary)] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                {poolApr.toFixed(2)}% {t('pools.apr')}
              </span>
            </div>
          ) : (
            <span className="text-sm text-[var(--text-secondary)]">
              {t('pools.il_calc_subtitle')}
            </span>
          )}
        </div>
      </div>

      {showPoolInput && (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 px-1">
            <Search size={12} className="text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              {t('pools.pool_address')}
            </span>
          </label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-3',
              'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
              'focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_0_3px_rgba(0,229,255,0.08)]',
              'transition-all duration-200',
            )}
          >
            <input
              type="text"
              value={poolInput}
              onChange={handlePoolInputChange}
              placeholder={t('pools.pool_address_placeholder')}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              className={cn(
                'flex-1 bg-transparent outline-none',
                'text-sm font-medium text-[var(--text-primary)]',
                'placeholder:text-[var(--text-tertiary)]',
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 px-1">
            <DollarSign size={12} className="text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              {t('pools.deposit_amount')}
            </span>
          </label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-3',
              'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
              'focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_0_3px_rgba(0,229,255,0.08)]',
              'transition-all duration-200',
            )}
          >
            <span className="text-sm text-[var(--text-secondary)] font-medium">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={depositInput}
              onChange={handleDepositChange}
              placeholder={t('pools.deposit_placeholder')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={cn(
                'flex-1 bg-transparent outline-none',
                'text-lg font-semibold text-[var(--text-primary)]',
                'placeholder:text-[var(--text-tertiary)]',
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 px-1">
            <CalendarDays size={12} className="text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              {t('pools.days_in_pool')}
            </span>
          </label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-3',
              'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
              'focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_0_3px_rgba(0,229,255,0.08)]',
              'transition-all duration-200',
            )}
          >
            <input
              type="text"
              inputMode="numeric"
              value={daysInput}
              onChange={handleDaysChange}
              placeholder={t('pools.days_placeholder')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={cn(
                'flex-1 bg-transparent outline-none',
                'text-lg font-semibold text-[var(--text-primary)]',
                'placeholder:text-[var(--text-tertiary)]',
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <span className="text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">
              {t('pools.days_in_pool').toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 px-1">
          <TrendingUp size={12} className="text-[var(--text-secondary)]" />
          <span className="text-xs text-[var(--text-secondary)]">
            {t('pools.price_change')}
          </span>
        </label>
        <ILSlider value={priceChangePct} onChange={setPriceChangePct} />
      </div>

      <div
        className={cn(
          'card flex items-center justify-between gap-4 px-4 py-3',
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
            {t('pools.current_price')}
          </span>
          <span
            className="text-sm font-bold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            1.00x
          </span>
        </div>
        <ArrowRight size={16} className="text-[var(--text-secondary)]" />
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
            {t('pools.new_price')}
          </span>
          <span
            className={cn(
              'text-sm font-bold',
              priceChangePct === 0
                ? 'text-[var(--text-primary)]'
                : priceChangePct > 0
                  ? 'text-[var(--accent-tertiary)]'
                  : 'text-[var(--accent-danger)]',
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {priceRatio.toFixed(2)}x
          </span>
        </div>
      </div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 py-12"
        >
          <Loader2 size={20} className="text-[var(--accent-primary)] animate-spin" />
          <span className="text-sm text-[var(--text-secondary)]">
            {t('common.loading')}
          </span>
        </motion.div>
      )}

      {!isLoading && simulation && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          <ILBreakdown simulation={simulation} />
          <ILChart priceChangePct={priceChangePct} />
        </motion.div>
      )}

      {!isLoading && !simulation && !poolAddress && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 py-12',
            'rounded-xl border border-dashed border-[var(--border-subtle)]',
            'bg-[var(--bg-surface)]/30',
          )}
        >
          <Droplets size={32} className="text-[var(--text-secondary)] opacity-40" />
          <span className="text-sm text-[var(--text-secondary)]">
            {t('pools.no_pool_selected')}
          </span>
        </div>
      )}

      {poolAddress && (
        <motion.a
          href={`/app/pools/add?pool=${poolAddress}`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl',
            'font-semibold text-sm transition-all duration-200',
            'text-[var(--bg-surface)]',
          )}
          style={{ background: 'var(--gradient-primary)' }}
        >
          <Droplets size={16} />
          {t('pools.add_liquidity')}
        </motion.a>
      )}
    </div>
  );
}
