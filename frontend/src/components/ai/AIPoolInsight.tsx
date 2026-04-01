'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle, ThumbsUp, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { usePoolAnalysis } from '@/hooks/useAI';

interface AIPoolInsightProps {
  poolAddress: string;
  className?: string;
}

function getSustainabilityColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'high':
      return 'text-[var(--accent-tertiary)]';
    case 'medium':
      return 'text-[var(--accent-warning)]';
    case 'low':
      return 'text-[var(--accent-danger)]';
    default:
      return 'text-[var(--text-secondary)]';
  }
}

function getILRiskColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'text-[var(--accent-tertiary)]';
    case 'medium':
      return 'text-[var(--accent-warning)]';
    case 'high':
      return 'text-[var(--accent-danger)]';
    default:
      return 'text-[var(--text-secondary)]';
  }
}

export function AIPoolInsight({ poolAddress, className }: AIPoolInsightProps) {
  const { insight, isLoading, error, refetch } = usePoolAnalysis(poolAddress);

  if (isLoading) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
          <span className="text-sm text-[var(--text-secondary)]">{t('ai.analyzing')}</span>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <Sparkles className="w-6 h-6 text-[var(--text-tertiary)]" />
          <p className="text-xs text-[var(--text-secondary)]">
            {error ? t('ai.analysis_error') : t('ai.connect_wallet')}
          </p>
          {error && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-medium hover:bg-[var(--accent-primary)]/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {t('common.retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-[20px] overflow-hidden',
        'bg-surface-alpha backdrop-blur-xl',
        'border border-[var(--border-subtle)]',
        'shadow-[var(--shadow-md)]',
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('ai.pool_insight')}</h3>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {insight.apr_sustainability && (
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(240,180,41,0.04))',
                boxShadow: '0 0 10px rgba(240,180,41,0.08)',
              }}
            >
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {t('ai.apr_sustainability')}
                </span>
                <span className={cn('text-xs font-bold', getSustainabilityColor(insight.apr_sustainability.level))}>
                  {insight.apr_sustainability.level}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                {insight.apr_sustainability.reason}
              </p>
            </div>
          </div>
        )}

        {insight.il_risk && (
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,184,0,0.12), rgba(255,184,0,0.04))',
                boxShadow: '0 0 10px rgba(255,184,0,0.08)',
              }}
            >
              <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {t('ai.il_risk')}
                </span>
                <span className={cn('text-xs font-bold', getILRiskColor(insight.il_risk.level))}>
                  {insight.il_risk.level}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                {insight.il_risk.reason}
              </p>
            </div>
          </div>
        )}

        {insight.recommendation && (
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
                boxShadow: '0 0 10px rgba(16,185,129,0.08)',
              }}
            >
              <ThumbsUp className="w-4 h-4 text-[var(--accent-tertiary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                {t('ai.recommendation')}
              </span>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                {insight.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
