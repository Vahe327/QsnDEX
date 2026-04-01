'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Fuel, TrendingDown, DollarSign, Zap } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';

interface BatchSummaryProps {
  batchGas: number;
  separateGas: number;
  gasSavingsPct: number;
  gasCostUsd: number;
}

export function BatchSummary({
  batchGas,
  separateGas,
  gasSavingsPct,
  gasCostUsd,
}: BatchSummaryProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const target = Math.min(100, Math.max(0, gasSavingsPct));
    const duration = 600;
    const startTime = performance.now();
    const startVal = animatedPct;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;
      setAnimatedPct(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasSavingsPct]);

  const savingsColor =
    gasSavingsPct >= 30
      ? 'var(--accent-primary)'
      : gasSavingsPct >= 15
        ? 'var(--accent-tertiary)'
        : 'var(--accent-warning)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'card relative overflow-hidden p-4'
      )}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${savingsColor}, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <Zap size={14} color="#fff" />
          </div>
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
          >
            {t('batch.gasSummary')}
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                className="text-xs"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
              >
                {t('batch.batchGasCost')}
              </span>
            </div>
            <span
              className="text-sm font-medium tabular-nums"
              style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
            >
              {formatNumber(batchGas)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                className="text-xs"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
              >
                {t('batch.separateGasCost')}
              </span>
            </div>
            <span
              className="text-sm font-medium tabular-nums line-through opacity-60"
              style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
            >
              {formatNumber(separateGas)}
            </span>
          </div>

          <div
            className="h-px w-full"
            style={{ backgroundColor: 'var(--border-subtle)' }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                className="text-xs"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
              >
                {t('batch.gasCostUsd')}
              </span>
            </div>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
            >
              ${formatNumber(gasCostUsd)}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
              >
                {t('batch.gasSavings')}
              </span>
              <motion.span
                key={gasSavingsPct}
                initial={{ scale: 1.15, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold tabular-nums"
                style={{ color: savingsColor, textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {animatedPct.toFixed(1)}%
              </motion.span>
            </div>

            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-surface-2) 80%, transparent)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), inset 0 -1px 1px rgba(255,255,255,0.05)',
              }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, animatedPct)}%` }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  background: `linear-gradient(90deg, ${savingsColor}, color-mix(in srgb, ${savingsColor} 70%, #fff))`,
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.2), 0 0 8px ${savingsColor}40`,
                }}
              />
            </div>

            <p
              className="text-[11px] mt-1.5 text-center"
              style={{ color: savingsColor, textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {t('batch.savedGas', { pct: gasSavingsPct.toFixed(1) })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
