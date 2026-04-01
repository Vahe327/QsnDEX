'use client';

import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface AIRiskBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

function getRiskLevel(score: number): { labelKey: string; color: string; bg: string; ring: string; glow: string } {
  if (score <= 3) {
    return {
      labelKey: 'ai.risk_low',
      color: 'text-[var(--accent-tertiary)]',
      bg: 'bg-[var(--accent-tertiary)]/10',
      ring: 'ring-[var(--accent-tertiary)]/30',
      glow: '0 0 8px rgba(16,185,129,0.15)',
    };
  }
  if (score <= 6) {
    return {
      labelKey: 'ai.risk_medium',
      color: 'text-[var(--accent-warning)]',
      bg: 'bg-[var(--accent-warning)]/10',
      ring: 'ring-[var(--accent-warning)]/30',
      glow: '0 0 8px rgba(255,184,0,0.15)',
    };
  }
  return {
    labelKey: 'ai.risk_high',
    color: 'text-[var(--accent-danger)]',
    bg: 'bg-[var(--accent-danger)]/10',
    ring: 'ring-[var(--accent-danger)]/30',
    glow: '0 0 8px rgba(239,68,68,0.15)',
  };
}

function getCircleColor(score: number): string {
  if (score <= 3) return '#10B981';
  if (score <= 6) return '#D97706';
  return '#EF4444';
}

export function AIRiskBadge({ score, size = 'md', showLabel = true, className }: AIRiskBadgeProps) {
  const clampedScore = Math.max(1, Math.min(10, Math.round(score)));
  const risk = getRiskLevel(clampedScore);
  const circleColor = getCircleColor(clampedScore);

  const sizeMap = {
    sm: { badge: 'px-1.5 py-0.5 gap-1', circle: 'w-3 h-3', text: 'text-[10px]', font: 'text-[8px]' },
    md: { badge: 'px-2 py-1 gap-1.5', circle: 'w-4 h-4', text: 'text-xs', font: 'text-[9px]' },
    lg: { badge: 'px-3 py-1.5 gap-2', circle: 'w-5 h-5', text: 'text-sm', font: 'text-[10px]' },
  };

  const s = sizeMap[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full ring-1',
        risk.bg,
        risk.ring,
        s.badge,
        className,
      )}
      style={{ boxShadow: risk.glow }}
    >
      <div className={cn('relative flex items-center justify-center rounded-full', s.circle)}>
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-[var(--border-subtle)]"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={circleColor}
            strokeWidth="3"
            strokeDasharray={`${(clampedScore / 10) * 94.25} 94.25`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className={cn('absolute font-bold', s.font, risk.color)}
        >
          {clampedScore}
        </span>
      </div>
      {showLabel && (
        <span className={cn('font-semibold', s.text, risk.color)}>
          {t(risk.labelKey)}
        </span>
      )}
    </div>
  );
}
