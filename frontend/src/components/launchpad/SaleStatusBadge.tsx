'use client';

import { t } from '@/i18n';

interface SaleStatusBadgeProps {
  status: 'active' | 'upcoming' | 'ended';
}

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  active: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
  },
  upcoming: {
    bg: 'rgba(240, 180, 41, 0.1)',
    border: 'rgba(240, 180, 41, 0.3)',
    color: '#f0b429',
  },
  ended: {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.3)',
    color: '#94a3b8',
  },
};

export function SaleStatusBadge({ status }: SaleStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.ended;
  const labelKey = `launchpad.status_${status}` as const;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {status === 'active' && (
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
          style={{ background: style.color }}
        />
      )}
      {t(labelKey)}
    </span>
  );
}
