'use client';

import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import type { EntrySignalResponse } from '@/lib/api';

interface EntryMetricsProps {
  metrics: EntrySignalResponse['metrics'];
  className?: string;
}

interface MetricRowConfig {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  value: number;
  suffix: string;
  min: number;
  max: number;
  invertColor: boolean;
}

function formatMetricValue(value: number, suffix: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}${suffix}`;
}

function getValueColor(value: number, invertColor: boolean): string {
  if (invertColor) {
    if (value > 0) return 'text-[var(--accent-danger)]';
    if (value < 0) return 'text-[var(--accent-tertiary)]';
    return 'text-[var(--text-secondary)]';
  }
  if (value > 0) return 'text-[var(--accent-tertiary)]';
  if (value < 0) return 'text-[var(--accent-danger)]';
  return 'text-[var(--text-secondary)]';
}

function getBarColor(value: number, invertColor: boolean): string {
  if (invertColor) {
    if (value > 0) return 'bg-[var(--accent-danger)]';
    if (value < 0) return 'bg-[var(--accent-tertiary)]';
    return 'bg-[var(--text-secondary)]';
  }
  if (value > 0) return 'bg-[var(--accent-tertiary)]';
  if (value < 0) return 'bg-[var(--accent-danger)]';
  return 'bg-[var(--text-secondary)]';
}

function clampPercent(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 50;
  const normalized = ((value - min) / range) * 100;
  return Math.max(2, Math.min(98, normalized));
}

function MetricRow({ config }: { config: MetricRowConfig }) {
  const Icon = config.icon;
  const valueColor = getValueColor(config.value, config.invertColor);
  const barColor = getBarColor(config.value, config.invertColor);
  const barWidth = clampPercent(Math.abs(config.value), config.min, config.max);

  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--bg-surface-2)] flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--text-secondary)] truncate">
            {t(config.labelKey)}
          </span>
          <span className={cn('text-xs font-semibold tabular-nums', valueColor)}>
            {formatMetricValue(config.value, config.suffix)}
          </span>
        </div>

        <div className="relative w-full h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', barColor)}
            style={{ width: `${barWidth}%`, opacity: 0.8 }}
          />
        </div>
      </div>
    </div>
  );
}

export function EntryMetrics({ metrics, className }: EntryMetricsProps) {
  const rows: MetricRowConfig[] = [
    {
      key: 'vs_7d_avg',
      labelKey: 'entry.vs_7d_avg',
      icon: TrendingDown,
      value: metrics.vs_7d_avg,
      suffix: '%',
      min: 0,
      max: 30,
      invertColor: false,
    },
    {
      key: 'vs_30d_avg',
      labelKey: 'entry.vs_30d_avg',
      icon: TrendingUp,
      value: metrics.vs_30d_avg,
      suffix: '%',
      min: 0,
      max: 50,
      invertColor: false,
    },
    {
      key: 'rsi_14',
      labelKey: 'entry.rsi_14',
      icon: Activity,
      value: metrics.rsi_14,
      suffix: '',
      min: 0,
      max: 100,
      invertColor: false,
    },
    {
      key: 'volume_change_4h',
      labelKey: 'entry.volume_4h',
      icon: BarChart3,
      value: metrics.volume_change_4h,
      suffix: '%',
      min: 0,
      max: 200,
      invertColor: false,
    },
  ];

  return (
    <div className={cn('flex flex-col divide-y divide-[var(--border-subtle)]/50', className)}>
      {rows.map((row) => (
        <MetricRow key={row.key} config={row} />
      ))}
    </div>
  );
}
