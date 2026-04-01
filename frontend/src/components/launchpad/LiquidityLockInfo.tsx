'use client';

import { Lock } from 'lucide-react';
import { t } from '@/i18n';

interface LiquidityLockInfoProps {
  liquidityPct: number;
  lockDuration: number;
}

export function LiquidityLockInfo({ liquidityPct, lockDuration }: LiquidityLockInfoProps) {
  const lockDays = Math.floor(lockDuration / 86400);
  const lockMonths = Math.floor(lockDays / 30);
  const lockLabel = lockMonths > 0
    ? t('launchpad.lock_months', { count: lockMonths })
    : t('launchpad.lock_days', { count: lockDays });

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: 'rgba(240, 180, 41, 0.08)',
          border: '1px solid rgba(240, 180, 41, 0.15)',
        }}
      >
        <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
      </div>
      <div>
        <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
          {t('launchpad.liquidity_lock')}
        </span>
        <span className="text-sm block mt-1" style={{ color: 'var(--text-secondary)' }}>
          {t('launchpad.liquidity_lock_desc', { pct: liquidityPct, duration: lockLabel })}
        </span>
      </div>
    </div>
  );
}
