'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { t } from '@/i18n';

interface PoolCountdownProps {
  periodFinish: number;
}

export function PoolCountdown({ periodFinish }: PoolCountdownProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const remaining = periodFinish - now;

  if (remaining <= 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--color-danger, #ef4444)',
          textShadow: '0 0 6px rgba(239, 68, 68, 0.2)',
        }}
      >
        <Clock className="w-3 h-3" />
        {t('staking_pools.ended')}
      </span>
    );
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const label = days > 0
    ? t('staking_pools.days_left', { days: days.toString() })
    : t('staking_pools.hours_left', { hours: hours.toString() });

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
      style={{
        background: 'rgba(240, 180, 41, 0.08)',
        border: '1px solid rgba(240, 180, 41, 0.15)',
        color: 'var(--text-secondary)',
        textShadow: '0 0 6px rgba(240, 180, 41, 0.15)',
      }}
    >
      <Clock className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
      {label}
    </span>
  );
}
