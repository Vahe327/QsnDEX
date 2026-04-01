'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Shield,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn, isAddress } from '@/lib/utils';
import { useSafetyCheck } from '@/hooks/useSafetyCheck';
import { SafetyScore } from '@/components/safety/SafetyScore';
import { SafetyRow } from '@/components/safety/SafetyRow';

export function MobileSafety() {
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
      if (e.key === 'Enter') handleSearch();
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
    <div className="px-3 pt-3 pb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))',
          }}
        >
          <Shield className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
            {t('safety.page_title')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('safety.page_subtitle')}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 p-3">
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={t('safety.search_placeholder')}
            className="flex-1 bg-transparent text-sm outline-none font-[var(--font-mono)] min-h-[36px]"
            style={{ color: 'var(--text-primary)' }}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="px-3 pb-3">
          <button
            onClick={handleSearch}
            disabled={!isValidInput || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold min-h-[44px] transition-all disabled:opacity-50"
            style={{
              background: isValidInput ? 'var(--gradient-primary)' : 'var(--bg-surface-2)',
              color: isValidInput ? '#000' : 'var(--text-tertiary)',
              boxShadow: isValidInput ? 'var(--glow-gold)' : 'none',
            }}
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
          <div className="px-3 pb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--accent-warning)' }} />
            <span className="text-xs" style={{ color: 'var(--accent-warning)' }}>
              {t('safety.invalid_address')}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-4 animate-pulse"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="h-12 rounded-xl" style={{ background: 'var(--bg-surface-2)' }} />
              </div>
            ))}
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--accent-danger)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('safety.error_message')}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold min-h-[44px]"
              style={{ background: 'var(--gradient-primary)', color: '#000' }}
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
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                {t('safety.token_label')}
              </span>
              <span className="flex-1 text-xs font-[var(--font-mono)] truncate" style={{ color: 'var(--text-primary)' }}>
                {data.token_address}
              </span>
              <button onClick={handleCopyAddress} className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center">
                {copied ? (
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent-tertiary)' }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                )}
              </button>
              {data.cached && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                    {t('safety.cached_result')}
                  </span>
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-5 flex flex-col items-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <SafetyScore score={data.safety_score} riskLevel={data.risk_level} size={120} />
              <p className="text-[10px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
                {t('safety.checked_at')} {new Date(data.checked_at).toLocaleString()}
              </p>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {t('safety.checks_title')}
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>
                  ({data.checks.length})
                </span>
              </h3>
              <div className="space-y-2">
                {data.checks.map((check: any, index: number) => (
                  <motion.div
                    key={check.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <SafetyRow check={check} />
                  </motion.div>
                ))}
              </div>
            </div>

            {data.ai_summary && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glow)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                    {t('safety.ai_analysis')}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  {data.ai_summary}
                </p>
              </motion.div>
            )}

            <a
              href={`/app/swap?token=${data.token_address}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold min-h-[48px]"
              style={{
                background: 'var(--gradient-primary)',
                color: '#000',
                boxShadow: 'var(--glow-gold)',
              }}
            >
              {t('safety.trade_token')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        )}

        {!data && !isLoading && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('safety.empty_state')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
