'use client';

import { motion } from 'framer-motion';
import { Shield, TrendingUp, TrendingDown, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { AIRiskBadge } from './AIRiskBadge';
import { useTokenAnalysis } from '@/hooks/useAI';

interface AITokenAnalysisProps {
  tokenAddress: string;
  tokenSymbol?: string;
  className?: string;
}

export function AITokenAnalysis({ tokenAddress, tokenSymbol, className }: AITokenAnalysisProps) {
  const { analysis, isLoading, error, refetch } = useTokenAnalysis(tokenAddress);

  if (isLoading) {
    return (
      <div className={cn('card p-6', className)}>
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
          <span className="text-sm text-[var(--text-secondary)]">{t('ai.analyzing')}</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className={cn('card p-6', className)}>
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <Shield className="w-8 h-8 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            {error ? t('ai.analysis_error') : t('ai.connect_wallet')}
          </p>
          {error && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-medium hover:bg-[var(--accent-primary)]/20 transition-colors"
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
      initial={{ opacity: 0, y: 12 }}
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(217,119,6,0.15))',
              boxShadow: '0 0 12px rgba(99,102,241,0.1)',
            }}
          >
            <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {t('ai.token_analysis')}
              {tokenSymbol && <span className="ml-1 text-[var(--text-secondary)]">({tokenSymbol})</span>}
            </h3>
            <p className="text-[10px] text-[var(--text-tertiary)]">{t('ai.powered_by')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIRiskBadge score={analysis.risk_score} />
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-secondary)]">{t('ai.risk_score')}</span>
          <span className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {analysis.risk_score}/10
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.risk_score * 10}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              analysis.risk_score <= 3 && 'bg-[var(--accent-tertiary)] shadow-[0_0_8px_rgba(16,185,129,0.3)]',
              analysis.risk_score > 3 && analysis.risk_score <= 6 && 'bg-[var(--accent-warning)] shadow-[0_0_8px_rgba(255,184,0,0.3)]',
              analysis.risk_score > 6 && 'bg-[var(--accent-danger)] shadow-[0_0_8px_rgba(239,68,68,0.3)]',
            )}
          />
        </div>
      </div>

      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-tertiary)]" />
            <h4 className="text-xs font-semibold text-[var(--accent-tertiary)]">{t('ai.strengths')}</h4>
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--accent-tertiary)] flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown className="w-3.5 h-3.5 text-[var(--accent-danger)]" />
            <h4 className="text-xs font-semibold text-[var(--accent-danger)]">{t('ai.weaknesses')}</h4>
          </div>
          <ul className="space-y-2">
            {analysis.weaknesses.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--accent-danger)] flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.outlook && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Eye className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <h4 className="text-xs font-semibold text-[var(--accent-primary)]">{t('ai.outlook')}</h4>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{analysis.outlook}</p>
        </div>
      )}
    </motion.div>
  );
}
