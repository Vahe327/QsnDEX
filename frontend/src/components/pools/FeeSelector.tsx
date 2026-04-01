'use client';

import { motion } from 'framer-motion';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { FEE_TIERS } from '@/config/tokens';

interface FeeSelectorProps {
  selected: number;
  onChange: (fee: number) => void;
  className?: string;
}

export function FeeSelector({ selected, onChange, className }: FeeSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-[var(--text-secondary)]">
        {t('pools.select_fee')}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FEE_TIERS.map((tier) => {
          const isActive = selected === tier.value;
          return (
            <button
              key={tier.value}
              onClick={() => onChange(tier.value)}
              className={cn(
                'relative p-3 rounded-xl border text-left transition-all duration-200',
                isActive
                  ? 'border-[var(--border-active)] bg-[var(--accent-primary)]/8 shadow-[0_0_16px_rgba(240,180,41,0.12)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-glow)]',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="fee-selector-active"
                  className="absolute inset-0 rounded-xl border-2 border-[var(--accent-primary)]"
                  style={{ boxShadow: '0 0 12px rgba(240,180,41,0.2)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  'relative block text-sm font-bold',
                  isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]',
                )}
              >
                {tier.label}
              </span>
              <span className="relative block text-[10px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                {t(tier.descriptionKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
