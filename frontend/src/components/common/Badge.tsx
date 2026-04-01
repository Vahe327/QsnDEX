'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 shadow-[0_0_8px_rgba(0,229,255,0.08)]',
  success:
    'bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)] border-[var(--accent-tertiary)]/20 shadow-[0_0_8px_rgba(0,255,163,0.08)]',
  danger:
    'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] border-[var(--accent-danger)]/20 shadow-[0_0_8px_rgba(255,59,92,0.08)]',
  warning:
    'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border-[var(--accent-warning)]/20 shadow-[0_0_8px_rgba(255,184,0,0.08)]',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
