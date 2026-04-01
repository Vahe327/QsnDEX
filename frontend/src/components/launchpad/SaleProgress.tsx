'use client';

import { t } from '@/i18n';
import { formatNumber } from '@/lib/formatters';

interface SaleProgressProps {
  raised: string;
  softCap: string;
  hardCap: string;
  symbol?: string;
}

export function SaleProgress({ raised, softCap, hardCap, symbol = 'ETH' }: SaleProgressProps) {
  const raisedNum = Number(raised);
  const hardCapNum = Number(hardCap);
  const softCapNum = Number(softCap);

  const progressPct = hardCapNum > 0 ? Math.min((raisedNum / hardCapNum) * 100, 100) : 0;
  const softCapPct = hardCapNum > 0 ? (softCapNum / hardCapNum) * 100 : 0;

  return (
    <div>
      <div
        className="relative h-3 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-sunken)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: 'var(--gradient-primary)',
            boxShadow: progressPct > 0 ? '0 0 8px rgba(240, 180, 41, 0.4)' : 'none',
          }}
        />
        {softCapPct > 0 && softCapPct < 100 && (
          <div
            className="absolute inset-y-0 w-0.5"
            style={{
              left: `${softCapPct}%`,
              background: 'rgba(255, 255, 255, 0.4)',
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {formatNumber(raisedNum)} {symbol} {t('launchpad.raised')}
        </span>
        <span
          className="text-xs font-medium"
          style={{
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          }}
        >
          {progressPct.toFixed(1)}%
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {formatNumber(hardCapNum)} {symbol} {t('launchpad.hard_cap')}
        </span>
      </div>

      {softCapPct > 0 && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {t('launchpad.soft_cap')}: {formatNumber(softCapNum)} {symbol}
        </div>
      )}
    </div>
  );
}
