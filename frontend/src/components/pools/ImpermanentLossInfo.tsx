'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface ImpermanentLossInfoProps {
  className?: string;
  priceChangePercent?: number;
}

function calculateIL(priceChangePercent: number): number {
  const priceRatio = 1 + priceChangePercent / 100;
  const sqrtRatio = Math.sqrt(priceRatio);
  const il = (2 * sqrtRatio) / (1 + priceRatio) - 1;
  return Math.abs(il) * 100;
}

const examples = [
  { change: 25, label: '1.25x' },
  { change: 50, label: '1.5x' },
  { change: 100, label: '2x' },
  { change: 200, label: '3x' },
  { change: 400, label: '5x' },
];

export function ImpermanentLossInfo({ className, priceChangePercent }: ImpermanentLossInfoProps) {
  const [expanded, setExpanded] = useState(false);

  const currentIL = priceChangePercent !== undefined ? calculateIL(priceChangePercent) : null;

  return (
    <div
      className={cn(
        'card overflow-hidden',
        className,
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-surface-2)]/50 transition-colors"
      >
        <Info size={18} className="text-[var(--accent-primary)] flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
          {t('pools.impermanent_loss')}
        </span>
        {currentIL !== null && (
          <span
            className={cn(
              'text-sm font-semibold',
              currentIL > 5 ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-warning)]',
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ~{currentIL.toFixed(2)}%
          </span>
        )}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[var(--text-secondary)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-warning)]/8 border border-[var(--accent-warning)]/15">
                <AlertTriangle size={16} className="text-[var(--accent-warning)] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {t('pools.il_description')}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                  {t('pools.il_by_price_change')}
                </h5>
                <div className="grid grid-cols-5 gap-1.5">
                  {examples.map((ex) => {
                    const il = calculateIL(ex.change);
                    return (
                      <div
                        key={ex.change}
                        className="flex flex-col items-center p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]"
                      >
                        <span className="text-xs font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                          {ex.label}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] mt-0.5',
                            il > 5 ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-warning)]',
                          )}
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          -{il.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-[var(--text-tertiary)] italic">
                {t('pools.il_note')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
