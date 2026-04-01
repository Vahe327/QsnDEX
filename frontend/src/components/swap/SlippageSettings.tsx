'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, Route, ShieldCheck } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';

interface SlippageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: '0.1%', value: 10 },
  { label: '0.5%', value: 50 },
  { label: '1.0%', value: 100 },
];

export function SlippageSettings({ isOpen, onClose }: SlippageSettingsProps) {
  const slippage = useSettingsStore((s) => s.slippage);
  const deadline = useSettingsStore((s) => s.deadline);
  const multihop = useSettingsStore((s) => s.multihop);
  const infiniteApproval = useSettingsStore((s) => s.infiniteApproval);
  const setSlippage = useSettingsStore((s) => s.setSlippage);
  const setDeadline = useSettingsStore((s) => s.setDeadline);
  const setMultihop = useSettingsStore((s) => s.setMultihop);
  const setInfiniteApproval = useSettingsStore((s) => s.setInfiniteApproval);

  const [customSlippage, setCustomSlippage] = useState(() => {
    const isPreset = PRESETS.some((p) => p.value === slippage);
    return isPreset ? '' : (slippage / 100).toString();
  });

  const isCustom = !PRESETS.some((p) => p.value === slippage);
  const slippageWarning = slippage > 500;
  const slippageLow = slippage < 10;

  const handlePresetClick = useCallback(
    (value: number) => {
      setSlippage(value);
      setCustomSlippage('');
    },
    [setSlippage]
  );

  const handleCustomChange = useCallback(
    (value: string) => {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setCustomSlippage(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
          setSlippage(Math.round(parsed * 100));
        }
      }
    },
    [setSlippage]
  );

  const handleDeadlineChange = useCallback(
    (value: string) => {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
        setDeadline(parsed);
      } else if (value === '') {
        setDeadline(20);
      }
    },
    [setDeadline]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-sm"
          >
            <div className="flex items-center justify-between p-5 border-b border-[rgba(56,189,248,0.06)]">
              <h3 className="text-lg font-bold text-[var(--color-text)]">{t('swap.settings')}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(30,41,59,0.5)] transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <label className="text-sm font-semibold text-[var(--color-text-secondary)] block mb-3">
                  {t('swap.slippageTolerance')}
                </label>
                <div className="flex items-center gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetClick(preset.value)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                        slippage === preset.value && !isCustom
                          ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-[0_2px_12px_rgba(6,182,212,0.3)]'
                          : 'bg-[rgba(6,10,19,0.6)] border border-[rgba(56,189,248,0.06)] text-[var(--color-text-secondary)] hover:border-[rgba(6,182,212,0.2)]'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={t('swap.custom')}
                      value={customSlippage}
                      onChange={(e) => handleCustomChange(e.target.value)}
                      className={cn(
                        'w-full py-2.5 px-3 pr-7 rounded-xl text-sm font-semibold text-center outline-none transition-all duration-200',
                        isCustom
                          ? 'bg-[rgba(6,182,212,0.1)] border border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'bg-[rgba(6,10,19,0.6)] border border-[rgba(56,189,248,0.06)] text-[var(--color-text-secondary)] placeholder-[var(--color-text-muted)]'
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                      %
                    </span>
                  </div>
                </div>
                {slippageWarning && (
                  <div className="flex items-center gap-2 mt-2 text-[var(--color-warning)]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs">{t('swap.highSlippageWarning')}</span>
                  </div>
                )}
                {slippageLow && (
                  <div className="flex items-center gap-2 mt-2 text-[var(--color-warning)]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs">{t('swap.lowSlippageWarning')}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-[var(--color-text-secondary)] flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                  {t('swap.transactionDeadline')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={deadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                    className={cn(
                      'w-20 py-2.5 px-3 rounded-xl text-sm font-semibold text-center outline-none transition-all duration-200',
                      'bg-[rgba(6,10,19,0.6)] border border-[rgba(56,189,248,0.06)] text-[var(--color-text)]',
                      'focus:border-[rgba(6,182,212,0.3)] focus:shadow-[0_0_12px_rgba(6,182,212,0.06)]'
                    )}
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{t('swap.minutes')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Route className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text-secondary)] block">
                      {t('swap.multihopTrades')}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{t('swap.multihopDesc')}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMultihop(!multihop)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-all duration-300',
                    multihop
                      ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-[rgba(30,41,59,0.8)]'
                  )}
                >
                  <motion.div
                    animate={{ x: multihop ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text-secondary)] block">
                      {t('swap.infiniteApproval')}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{t('swap.infiniteApprovalDesc')}</span>
                  </div>
                </div>
                <button
                  onClick={() => setInfiniteApproval(!infiniteApproval)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-all duration-300',
                    infiniteApproval
                      ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-[rgba(30,41,59,0.8)]'
                  )}
                >
                  <motion.div
                    animate={{ x: infiniteApproval ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
