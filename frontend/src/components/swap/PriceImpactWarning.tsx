'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatPercent, getPriceImpactLevel } from '@/lib/formatters';

interface PriceImpactWarningProps {
  priceImpact: number;
}

export function PriceImpactWarning({ priceImpact }: PriceImpactWarningProps) {
  const [dismissed, setDismissed] = useState(false);
  const level = getPriceImpactLevel(priceImpact);

  if (priceImpact <= 3 || dismissed) return null;

  const configs = {
    high: {
      bg: 'bg-[var(--color-warning)]/8',
      border: 'border-[var(--color-warning)]/20',
      iconColor: 'text-[var(--color-warning)]',
      titleColor: 'text-[var(--color-warning)]',
      textColor: 'text-[var(--color-warning)]/70',
      glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.06)]',
      title: t('swap.moderateImpact'),
      desc: t('swap.moderateImpactDesc', { impact: formatPercent(priceImpact) }),
    },
    very_high: {
      bg: 'bg-orange-500/8',
      border: 'border-orange-500/20',
      iconColor: 'text-orange-500',
      titleColor: 'text-orange-400',
      textColor: 'text-orange-400/70',
      glowColor: 'shadow-[0_0_20px_rgba(249,115,22,0.06)]',
      title: t('swap.highImpactWarning'),
      desc: t('swap.highImpactWarningDesc', { impact: formatPercent(priceImpact) }),
    },
    blocked: {
      bg: 'bg-[var(--color-danger)]/8',
      border: 'border-[var(--color-danger)]/20',
      iconColor: 'text-[var(--color-danger)]',
      titleColor: 'text-[var(--color-danger)]',
      textColor: 'text-[var(--color-danger)]/70',
      glowColor: 'shadow-[0_0_20px_rgba(248,113,113,0.06)]',
      title: t('swap.priceImpactTooHigh'),
      desc: t('swap.priceImpactTooHighDesc', { impact: formatPercent(priceImpact) }),
    },
  };

  const config = (configs as Record<string, typeof configs.high>)[level] ?? configs.high;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'mt-3 rounded-xl overflow-hidden',
          config.bg, config.border, config.glowColor,
          'border'
        )}
      >
        <div className="flex items-start gap-3 p-3.5">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AlertTriangle className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconColor)} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold', config.titleColor)}>{config.title}</p>
            <p className={cn('text-xs mt-0.5', config.textColor)}>{config.desc}</p>
          </div>
          {level !== 'blocked' && (
            <button
              onClick={() => setDismissed(true)}
              className={cn('p-1 rounded-lg hover:opacity-70 transition-opacity shrink-0', config.iconColor)}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
