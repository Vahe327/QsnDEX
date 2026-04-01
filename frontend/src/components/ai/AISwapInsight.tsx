'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useSwapInsight } from '@/hooks/useAI';

interface AISwapInsightProps {
  tokenIn?: string;
  tokenOut?: string;
  className?: string;
}

export function AISwapInsight({ tokenIn, tokenOut, className }: AISwapInsightProps) {
  const { insight, isLoading, error } = useSwapInsight(tokenIn, tokenOut);

  if (!tokenIn || !tokenOut) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('overflow-hidden', className)}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-l-2 border-[var(--accent-primary)]"
            style={{ background: 'linear-gradient(90deg, rgba(240,180,41,0.06), transparent)' }}
          >
            <Loader2 className="w-3 h-3 text-[var(--accent-primary)] animate-spin flex-shrink-0" />
            <span className="text-xs text-[var(--text-tertiary)]">{t('ai.analyzing')}</span>
          </div>
        </motion.div>
      )}

      {!isLoading && insight && !error && (
        <motion.div
          key="insight"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('overflow-hidden', className)}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-l-2 border-[var(--accent-primary)]"
            style={{ background: 'linear-gradient(90deg, rgba(240,180,41,0.06), transparent)' }}
          >
            <Sparkles className="w-3 h-3 text-[var(--accent-primary)] flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {insight.message || insight.summary || String(insight)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
