'use client';

import { motion } from 'framer-motion';
import { RefreshCw, Info, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface AutopilotSettingsProps {
  scannedAt: string;
  onRescan: () => void;
  isLoading: boolean;
  className?: string;
}

function formatScanTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return iso;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60_000);

    if (diffMinutes < 1) {
      return t('autopilot.just_now');
    }
    if (diffMinutes < 60) {
      return t('autopilot.minutes_ago', { count: diffMinutes });
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return t('autopilot.hours_ago', { count: diffHours });
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AutopilotSettings({
  scannedAt,
  onRescan,
  isLoading,
  className,
}: AutopilotSettingsProps) {
  return (
    <motion.div
      className={cn(
        'card',
        'p-4 flex flex-col gap-3',
        className,
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <div className="flex items-start gap-2">
        <Info
          size={16}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--text-secondary)' }}
        />
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('autopilot.disclaimer')}
        </p>
      </div>

      <div
        className="h-px w-full"
        style={{ backgroundColor: 'var(--border-subtle)' }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
          <span
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('autopilot.last_scan')}: {formatScanTime(scannedAt)}
          </span>
        </div>

        <button
          onClick={onRescan}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
            'text-xs font-semibold',
            'transition-all duration-200',
            'hover:brightness-110 active:scale-[0.97]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <RefreshCw
            size={13}
            className={cn(isLoading && 'animate-spin')}
          />
          <span>{isLoading ? t('autopilot.scanning') : t('autopilot.rescan')}</span>
        </button>
      </div>
    </motion.div>
  );
}
