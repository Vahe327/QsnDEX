'use client';

import { Percent } from 'lucide-react';

interface APRBadgeProps {
  apr: number;
  size?: 'sm' | 'md';
}

export function APRBadge({ apr, size = 'sm' }: APRBadgeProps) {
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const padding = size === 'md' ? 'px-3 py-1.5' : 'px-2 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-bold ${textSize} ${padding}`}
      style={{
        background: 'linear-gradient(135deg, rgba(240, 180, 41, 0.15), rgba(240, 180, 41, 0.05))',
        border: '1px solid rgba(240, 180, 41, 0.3)',
        color: 'var(--accent-primary)',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        textShadow: '0 0 8px rgba(240, 180, 41, 0.3)',
      }}
    >
      <Percent className={iconSize} />
      {apr.toFixed(1)}%
    </span>
  );
}
