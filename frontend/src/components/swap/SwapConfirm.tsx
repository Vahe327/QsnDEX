'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, AlertTriangle, Info } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercent, getPriceImpactColor, getPriceImpactLevel } from '@/lib/formatters';
import { useSettingsStore } from '@/store/settingsStore';
import type { TokenInfo } from '@/config/tokens';

interface SwapConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  route: string[];
  getToken: (address: string) => TokenInfo | undefined;
  isSwapping: boolean;
}

export function SwapConfirm({
  isOpen,
  onClose,
  onConfirm,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  priceImpact,
  route,
  getToken,
  isSwapping,
}: SwapConfirmProps) {
  const slippage = useSettingsStore((s) => s.slippage);
  const impactColor = getPriceImpactColor(priceImpact);
  const impactLevel = getPriceImpactLevel(priceImpact);
  const isHighImpact = impactLevel === 'high' || impactLevel === 'very_high';

  const minReceived = (() => {
    const outVal = parseFloat(amountOut);
    if (!outVal) return '0';
    return formatNumber(outVal * (1 - slippage / 10000));
  })();

  const rate = (() => {
    const inVal = parseFloat(amountIn);
    const outVal = parseFloat(amountOut);
    if (!inVal || !outVal || !tokenIn || !tokenOut) return '';
    return `1 ${tokenIn.symbol} = ${formatNumber(outVal / inVal)} ${tokenOut.symbol}`;
  })();

  if (!isOpen || !tokenIn || !tokenOut) return null;

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
            className="card w-full max-w-md"
          >
            <div className="flex items-center justify-between p-5 border-b border-[rgba(56,189,248,0.06)]">
              <h3 className="text-lg font-bold text-[var(--color-text)]">{t('swap.confirmSwap')}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(30,41,59,0.5)] transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="input-sunken p-4">
                <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider font-medium">
                  {t('swap.youPay')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[var(--color-text)] font-[var(--font-mono)] tabular-nums">
                    {amountIn}
                  </span>
                  <div className="flex items-center gap-2">
                    <TokenIcon address={tokenIn.address} symbol={tokenIn.symbol} logoURI={tokenIn.logoURI} size="md" />
                    <span className="font-bold text-[var(--color-text)]">{tokenIn.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-1">
                <div className="w-10 h-10 rounded-full bg-[rgba(15,23,42,0.8)] border border-[rgba(6,182,212,0.1)] flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.06)]">
                  <ArrowDown className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
              </div>

              <div className="input-sunken p-4">
                <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider font-medium">
                  {t('swap.youReceive')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[var(--color-text)] font-[var(--font-mono)] tabular-nums">
                    {formatNumber(amountOut)}
                  </span>
                  <div className="flex items-center gap-2">
                    <TokenIcon address={tokenOut.address} symbol={tokenOut.symbol} logoURI={tokenOut.logoURI} size="md" />
                    <span className="font-bold text-[var(--color-text)]">{tokenOut.symbol}</span>
                  </div>
                </div>
              </div>

              {isHighImpact && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20"
                >
                  <AlertTriangle className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-danger)]">
                      {t('swap.highImpactWarning')}
                    </p>
                    <p className="text-xs text-[var(--color-danger)]/70 mt-0.5">
                      {t('swap.highImpactWarningDesc', { impact: formatPercent(priceImpact) })}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="input-sunken space-y-2.5 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">{t('swap.rate')}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">{rate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">{t('swap.priceImpact')}</span>
                  <span className={cn('text-sm font-semibold font-[var(--font-mono)]', impactColor)}>
                    {formatPercent(priceImpact)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">{t('swap.minReceived')}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
                    {minReceived} {tokenOut.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">{t('swap.slippage')}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
                    {(slippage / 100).toFixed(2)}%
                  </span>
                </div>
                {route.length > 2 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">{t('swap.route')}</span>
                    <div className="flex items-center gap-1">
                      {route.map((addr, idx) => {
                        const tok = getToken(addr);
                        return (
                          <span key={addr} className="text-xs text-[var(--color-text-secondary)] font-[var(--font-mono)]">
                            {tok?.symbol || addr.slice(0, 6)}
                            {idx < route.length - 1 ? ' > ' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{t('swap.confirmDisclaimer')}</span>
              </div>

              <motion.button
                whileHover={!isSwapping ? { scale: 1.01, y: -2 } : {}}
                whileTap={!isSwapping ? { scale: 0.99 } : {}}
                onClick={onConfirm}
                disabled={isSwapping}
                className={cn(
                  'btn-primary w-full h-14 rounded-2xl',
                  isHighImpact && '[&]:bg-gradient-to-r [&]:from-red-600 [&]:to-red-500 [&]:shadow-[0_4px_20px_rgba(239,68,68,0.3)]',
                  isSwapping && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSwapping ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t('swap.swapping')}
                  </>
                ) : isHighImpact ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    {t('swap.swapAnyway')}
                  </>
                ) : (
                  t('swap.confirmSwap')
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
