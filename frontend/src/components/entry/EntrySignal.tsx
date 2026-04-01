'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertTriangle, Zap, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useEntrySignal } from '@/hooks/useEntrySignal';
import { EntryMetrics } from './EntryMetrics';

interface EntrySignalProps {
  tokenAddress: string | undefined;
  className?: string;
}

interface SignalBadgeStyle {
  labelKey: string;
  text: string;
  bg: string;
  ring: string;
  glow: string;
}

function getSignalBadgeStyle(signal: string): SignalBadgeStyle {
  switch (signal) {
    case 'FAVORABLE':
      return {
        labelKey: 'entry.signal_favorable',
        text: 'text-[var(--accent-tertiary)]',
        bg: 'bg-[var(--accent-tertiary)]/12',
        ring: 'ring-[var(--accent-tertiary)]/30',
        glow: '0 0 20px rgba(16,185,129,0.15), 0 0 40px rgba(16,185,129,0.05)',
      };
    case 'UNFAVORABLE':
      return {
        labelKey: 'entry.signal_unfavorable',
        text: 'text-[var(--accent-danger)]',
        bg: 'bg-[var(--accent-danger)]/12',
        ring: 'ring-[var(--accent-danger)]/30',
        glow: '0 0 20px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.05)',
      };
    case 'NEUTRAL':
    default:
      return {
        labelKey: 'entry.signal_neutral',
        text: 'text-[var(--accent-primary)]',
        bg: 'bg-[var(--accent-primary)]/12',
        ring: 'ring-[var(--accent-primary)]/30',
        glow: '0 0 20px rgba(240,180,41,0.15), 0 0 40px rgba(240,180,41,0.05)',
      };
  }
}

function getRsiZoneColor(rsi: number): string {
  if (rsi <= 30) return '#10B981';
  if (rsi >= 70) return '#EF4444';
  return 'var(--text-secondary)';
}

function formatUsd(value: number): string {
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toExponential(3)}`;
}

function RsiGauge({ rsi }: { rsi: number }) {
  const clampedRsi = Math.max(0, Math.min(100, rsi));
  const dotPosition = (clampedRsi / 100) * 100;
  const dotColor = getRsiZoneColor(clampedRsi);

  return (
    <div className="px-1 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">
          {t('entry.rsi_14')}
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: dotColor }}
        >
          {clampedRsi.toFixed(1)}
        </span>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{ width: '30%', background: 'linear-gradient(90deg, #10B981, #10B98180)' }}
          />
          <div
            className="h-full"
            style={{ width: '40%', background: 'linear-gradient(90deg, rgba(128,128,128,0.3), rgba(128,128,128,0.2))' }}
          />
          <div
            className="h-full"
            style={{ width: '30%', background: 'linear-gradient(90deg, #EF444480, #EF4444)' }}
          />
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)] transition-all duration-500 z-10"
          style={{
            left: `${dotPosition}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: dotColor,
            boxShadow: `0 0 6px ${dotColor}`,
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-[var(--accent-tertiary)]/70">{t('entry.oversold')}</span>
        <span className="text-[9px] text-[var(--text-secondary)]/50">{t('entry.neutral')}</span>
        <span className="text-[9px] text-[var(--accent-danger)]/70">{t('entry.overbought')}</span>
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const style = getSignalBadgeStyle(signal);

  return (
    <div className="flex justify-center py-1">
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1',
          style.bg,
          style.ring,
          style.text,
        )}
        style={{ boxShadow: style.glow }}
      >
        <Zap className="w-4 h-4" />
        <span className="text-sm font-bold tracking-wide">{t(style.labelKey)}</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className={cn(
        'card',
        'p-5',
      )}
    >
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
        <span className="text-sm text-[var(--text-secondary)]">{t('entry.loading')}</span>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div
      className={cn(
        'card',
        'p-5',
        '!border-[var(--accent-danger)]/20',
      )}
    >
      <div className="flex items-center gap-3 py-4">
        <AlertTriangle className="w-5 h-5 text-[var(--accent-danger)] flex-shrink-0" />
        <span className="text-sm text-[var(--accent-danger)]">{t('entry.error')}</span>
      </div>
    </div>
  );
}

export function EntrySignal({ tokenAddress, className }: EntrySignalProps) {
  const { data, isLoading, error } = useEntrySignal(tokenAddress);

  if (!tokenAddress) return null;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <LoadingState />
      </motion.div>
    );
  }

  if (error || !data) {
    if (!error) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <ErrorState />
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`entry-signal-${data.token}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={className}
      >
        <div
          className={cn(
            'card',
          )}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {t('entry.title')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {data.cached && (
                <div className="flex items-center gap-1 opacity-50" title={t('entry.cached')}>
                  <Database className="w-3 h-3 text-[var(--text-secondary)]" />
                </div>
              )}
              <div className="flex flex-col items-end">
                <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                  {data.token}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                  {formatUsd(data.price_usd)}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--border-subtle)]/50" />

          <div className="px-4 py-1">
            <EntryMetrics metrics={data.metrics} />
          </div>

          <div className="h-px bg-[var(--border-subtle)]/50" />

          <div className="px-5 py-2">
            <RsiGauge rsi={data.metrics.rsi_14} />
          </div>

          <div className="h-px bg-[var(--border-subtle)]/50" />

          <div className="px-5 py-4">
            <SignalBadge signal={data.signal} />
          </div>

          {data.explanation && (
            <>
              <div className="h-px bg-[var(--border-subtle)]/50" />
              <div className="px-5 py-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium block mb-1">
                      {t('entry.ai_explanation')}
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {data.explanation}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]/50 mt-2 text-right">
                  {t('ai.disclaimer_short')}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
