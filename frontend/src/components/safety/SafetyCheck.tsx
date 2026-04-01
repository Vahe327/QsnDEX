'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Shield,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn, isAddress } from '@/lib/utils';
import { useSafetyCheck } from '@/hooks/useSafetyCheck';
import { SafetyScore } from './SafetyScore';
import { SafetyRow } from './SafetyRow';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[var(--bg-surface-2)] animate-pulse',
        className
      )}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex justify-center md:justify-start">
          <SkeletonBlock className="w-[120px] h-[120px] rounded-full" />
        </div>
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
        </div>
      </div>
      <SkeletonBlock className="h-32 w-full" />
    </div>
  );
}

export function SafetyCheck() {
  const [inputValue, setInputValue] = useState('');
  const [searchAddress, setSearchAddress] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const { data, isLoading, error, refetch } = useSafetyCheck(searchAddress);

  const handleSearch = useCallback(() => {
    const trimmed = inputValue.trim();
    if (isAddress(trimmed)) {
      setSearchAddress(trimmed);
    }
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text').trim();
      if (isAddress(pasted)) {
        e.preventDefault();
        setInputValue(pasted);
        setSearchAddress(pasted);
      }
    },
    []
  );

  const handleCopyAddress = useCallback(() => {
    if (searchAddress) {
      navigator.clipboard.writeText(searchAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [searchAddress]);

  const isValidInput = isAddress(inputValue.trim());

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('safety.page_title')}
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {t('safety.page_subtitle')}
        </p>
      </div>

      <div
        className={cn(
          'card',
          'relative transition-all duration-300',
          'focus-within:border-[var(--accent-primary)]/40',
          'focus-within:shadow-[0_0_24px_rgba(240,180,41,0.08)]'
        )}
      >
        <div className="flex items-center gap-3 p-4">
          <Search className="w-5 h-5 shrink-0 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={t('safety.search_placeholder')}
            className={cn(
              'flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none',
              'placeholder:text-[var(--text-secondary)]/50',
              'font-mono'
            )}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            onClick={handleSearch}
            disabled={!isValidInput || isLoading}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
              'flex items-center gap-2',
              isValidInput
                ? 'bg-[var(--accent-primary)] text-black hover:brightness-110 shadow-[0_2px_12px_rgba(240,180,41,0.3)]'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] cursor-not-allowed opacity-50'
            )}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {t('safety.check_button')}
          </button>
        </div>
        {inputValue.length > 0 && !isValidInput && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FFB800]" />
            <span className="text-xs text-[#FFB800]">
              {t('safety.invalid_address')}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSkeleton />
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'card',
              'p-6 text-center space-y-4',
              '!border-[#EF4444]/30'
            )}
          >
            <AlertTriangle className="w-10 h-10 mx-auto text-[#EF4444]" />
            <p className="text-sm text-[var(--text-secondary)]">
              {t('safety.error_message')}
            </p>
            <button
              onClick={() => refetch()}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                'bg-[var(--accent-primary)] text-black hover:brightness-110',
                'shadow-[0_2px_12px_rgba(240,180,41,0.3)]',
                'flex items-center gap-2 mx-auto'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.retry')}
            </button>
          </motion.div>
        )}

        {data && !isLoading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl',
                'bg-[var(--bg-surface)]/50 backdrop-blur-md',
                'border border-[var(--border-subtle)]'
              )}
            >
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {t('safety.token_label')}
              </span>
              <span className="flex-1 text-xs font-mono text-[var(--text-primary)] truncate">
                {data.token_address}
              </span>
              <button
                onClick={handleCopyAddress}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-200',
                  'hover:bg-[var(--bg-surface-2)]/50 text-[var(--text-secondary)]',
                  'hover:text-[var(--accent-primary)]'
                )}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {data.cached && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[var(--text-secondary)] opacity-60" />
                  <span className="text-[10px] text-[var(--text-secondary)] opacity-60">
                    {t('safety.cached_result')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div
                className={cn(
                  'card',
                  'flex flex-col items-center justify-center p-6',
                  'md:min-w-[200px]'
                )}
              >
                <SafetyScore
                  score={data.safety_score}
                  riskLevel={data.risk_level}
                  size={140}
                />
                <div className="mt-3 text-center">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('safety.checked_at')}{' '}
                    {new Date(data.checked_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  {t('safety.checks_title')}
                  <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
                    ({data.checks.length})
                  </span>
                </h3>
                {data.checks.map((check, index) => (
                  <motion.div
                    key={check.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <SafetyRow check={check} />
                  </motion.div>
                ))}
              </div>
            </div>

            {data.ai_summary && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className={cn(
                  'card',
                  'p-5',
                  '!border-[var(--accent-primary)]/20'
                )}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="text-sm font-semibold text-[var(--accent-primary)]">
                    {t('safety.ai_analysis')}
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {data.ai_summary}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[var(--text-secondary)] opacity-40" />
                  <span className="text-[10px] text-[var(--text-secondary)] opacity-50">
                    {t('ai.disclaimer_short')}
                  </span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex justify-center pt-2"
            >
              <a
                href={`/app/swap?token=${data.token_address}`}
                className={cn(
                  'inline-flex items-center gap-2.5 px-6 py-3 rounded-xl',
                  'text-sm font-bold transition-all duration-200',
                  'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-tertiary)]',
                  'text-black hover:brightness-110',
                  'shadow-[0_4px_20px_rgba(240,180,41,0.25)]',
                  'hover:shadow-[0_4px_28px_rgba(240,180,41,0.35)]',
                  'hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                {t('safety.trade_token')}
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>
        )}

        {!data && !isLoading && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'card',
              'p-10 text-center'
            )}
          >
            <Shield
              className="w-12 h-12 mx-auto mb-4 opacity-30"
              style={{ color: 'var(--accent-primary)' }}
            />
            <p className="text-sm text-[var(--text-secondary)]">
              {t('safety.empty_state')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
