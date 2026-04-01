'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface AIDisclaimerProps {
  variant?: 'inline' | 'banner';
  className?: string;
}

export function AIDisclaimer({ variant = 'inline', className }: AIDisclaimerProps) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-start gap-2.5 px-4 py-3 rounded-xl',
          'bg-[var(--accent-warning)]/5 backdrop-blur-xl',
          'border border-[var(--accent-warning)]/15',
          'shadow-[0_0_12px_rgba(255,184,0,0.04)]',
          className,
        )}
      >
        <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-md bg-[var(--accent-warning)]/10 flex items-center justify-center">
          <Info className="w-3.5 h-3.5 text-[var(--accent-warning)]" />
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--accent-warning)] mb-0.5">
            {t('ai.disclaimer_title')}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
            {t('ai.disclaimer_text')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Info className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />
      <p className="text-[10px] text-[var(--text-tertiary)]">
        {t('ai.disclaimer_short')}
      </p>
    </div>
  );
}
