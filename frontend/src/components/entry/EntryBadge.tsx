'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useEntrySignal } from '@/hooks/useEntrySignal';

interface EntryBadgeProps {
  tokenAddress: string | undefined;
  onExpand?: () => void;
  className?: string;
}

interface SignalStyle {
  labelKey: string;
  text: string;
  bg: string;
  ring: string;
  iconColor: string;
  glow: string;
}

function getSignalStyle(signal: string): SignalStyle {
  switch (signal) {
    case 'FAVORABLE':
      return {
        labelKey: 'entry.signal_favorable',
        text: 'text-[var(--accent-tertiary)]',
        bg: 'bg-[var(--accent-tertiary)]/10',
        ring: 'ring-[var(--accent-tertiary)]/25',
        iconColor: 'text-[var(--accent-tertiary)]',
        glow: '0 0 10px rgba(0,255,163,0.12)',
      };
    case 'UNFAVORABLE':
      return {
        labelKey: 'entry.signal_unfavorable',
        text: 'text-[var(--accent-danger)]',
        bg: 'bg-[var(--accent-danger)]/10',
        ring: 'ring-[var(--accent-danger)]/25',
        iconColor: 'text-[var(--accent-danger)]',
        glow: '0 0 10px rgba(255,59,92,0.12)',
      };
    case 'NEUTRAL':
    default:
      return {
        labelKey: 'entry.signal_neutral',
        text: 'text-[var(--accent-primary)]',
        bg: 'bg-[var(--accent-primary)]/10',
        ring: 'ring-[var(--accent-primary)]/25',
        iconColor: 'text-[var(--accent-primary)]',
        glow: '0 0 10px rgba(0,229,255,0.12)',
      };
  }
}

export function EntryBadge({ tokenAddress, onExpand, className }: EntryBadgeProps) {
  const { data, isLoading } = useEntrySignal(tokenAddress);

  if (isLoading || !data) return null;

  const style = getSignalStyle(data.signal);

  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 text-xs font-semibold',
        'transition-all duration-200 cursor-pointer',
        'hover:brightness-110 active:scale-[0.97]',
        style.bg,
        style.ring,
        style.text,
        !onExpand && 'pointer-events-none',
        className,
      )}
      style={{ boxShadow: style.glow }}
      disabled={!onExpand}
    >
      <Sparkles className={cn('w-3 h-3 flex-shrink-0', style.iconColor)} />
      <span className="truncate">{t(style.labelKey)}</span>
    </button>
  );
}
