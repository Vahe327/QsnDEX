'use client';

import { useState, useEffect, useCallback } from 'react';
import { t } from '@/i18n';

interface SaleCountdownProps {
  targetTimestamp: number;
  label: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetTimestamp: number): TimeLeft {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(targetTimestamp - now, 0);
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

export function SaleCountdown({ targetTimestamp, label }: SaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetTimestamp));

  const update = useCallback(() => {
    setTimeLeft(calculateTimeLeft(targetTimestamp));
  }, [targetTimestamp]);

  useEffect(() => {
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [update]);

  const totalSeconds = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  const isUrgent = totalSeconds > 0 && totalSeconds < 3600;
  const isFinished = totalSeconds === 0;
  const urgentColor = isUrgent ? '#ef4444' : 'var(--text-primary)';

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div>
      <span className="text-xs block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      {isFinished ? (
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {t('launchpad.ended_label')}
        </span>
      ) : (
        <div className="flex items-center gap-1.5">
          {[
            { value: timeLeft.days, unit: t('launchpad.days') },
            { value: timeLeft.hours, unit: t('launchpad.hours') },
            { value: timeLeft.minutes, unit: t('launchpad.minutes') },
            { value: timeLeft.seconds, unit: t('launchpad.seconds') },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span
                className="text-lg font-bold leading-none"
                style={{
                  color: urgentColor,
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                }}
              >
                {pad(item.value)}
              </span>
              <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
