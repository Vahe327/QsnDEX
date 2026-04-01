'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useSafetyCheck } from '@/hooks/useSafetyCheck';
import { SafetyRow } from './SafetyRow';

interface SafetyBannerProps {
  tokenAddress: string | undefined;
}

function getBorderColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return '#10B981';
    case 'medium':
      return '#D97706';
    case 'high':
      return '#EF4444';
    case 'critical':
      return '#EF4444';
    default:
      return 'var(--border-subtle)';
  }
}

function getRiskLabelKey(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'safety.risk_low';
    case 'medium':
      return 'safety.risk_medium';
    case 'high':
      return 'safety.risk_high';
    case 'critical':
      return 'safety.risk_critical';
    default:
      return 'safety.risk_unknown';
  }
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#10B981';
  if (score >= 5) return '#D97706';
  return '#EF4444';
}

function SkeletonBanner() {
  return (
    <div
      className={cn(
        'card',
        'p-3'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-[var(--bg-surface-2)] animate-pulse" />
        <div className="flex-1 h-4 rounded bg-[var(--bg-surface-2)] animate-pulse" />
        <div className="w-5 h-5 rounded bg-[var(--bg-surface-2)] animate-pulse" />
      </div>
    </div>
  );
}

export function SafetyBanner({ tokenAddress }: SafetyBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, error, refetch } = useSafetyCheck(tokenAddress);

  useEffect(() => {
    setExpanded(false);
  }, [tokenAddress]);

  if (!tokenAddress) return null;

  if (isLoading) return <SkeletonBanner />;

  if (error || !data) {
    return (
      <div
        className={cn(
          'card',
          'p-3',
          '!border-[#EF4444]/30'
        )}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#EF4444]" />
          <span className="text-sm text-[var(--text-secondary)] flex-1">
            {t('safety.check_failed')}
          </span>
          <button
            onClick={() => refetch()}
            className={cn(
              'p-1.5 rounded-lg transition-all duration-200',
              'hover:bg-[var(--bg-surface-2)]/50 text-[var(--text-secondary)]',
              'hover:text-[var(--accent-primary)]'
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const borderColor = getBorderColor(data.risk_level);
  const scoreColor = getScoreColor(data.safety_score);

  return (
    <div
      className={cn(
        'card',
        'transition-all duration-300'
      )}
      style={{ borderColor: `${borderColor}40` }}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'w-full flex items-center gap-3 p-3',
          'text-left transition-colors duration-200',
          'hover:bg-[var(--bg-surface-2)]/30 rounded-xl'
        )}
      >
        <Shield className="w-5 h-5 shrink-0" style={{ color: scoreColor }} />
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1">
          {t('safety.title')}:{' '}
          <span className="font-bold" style={{ color: scoreColor }}>
            {data.safety_score}/10
          </span>{' '}
          <span className="text-[var(--text-secondary)]">
            {t(getRiskLabelKey(data.risk_level))}
          </span>
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <div className="h-px bg-[var(--border-subtle)] opacity-50" />

              {data.checks.map((check, index) => (
                <motion.div
                  key={check.name}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <SafetyRow check={check} />
                </motion.div>
              ))}

              {data.ai_summary && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: data.checks.length * 0.05 }}
                  className={cn(
                    'mt-2 p-3 rounded-xl',
                    'bg-[var(--bg-surface-2)]/50 backdrop-blur-md',
                    'border border-[var(--accent-primary)]/15'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-xs font-semibold text-[var(--accent-primary)]">
                      {t('safety.ai_analysis')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {data.ai_summary}
                  </p>
                </motion.div>
              )}

              {data.cached && (
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <span className="text-[10px] text-[var(--text-secondary)] opacity-60">
                    {t('safety.cached_result')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      refetch();
                    }}
                    className={cn(
                      'p-1 rounded-md transition-all duration-200',
                      'hover:bg-[var(--bg-surface-2)]/50 text-[var(--text-secondary)]',
                      'hover:text-[var(--accent-primary)]'
                    )}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
