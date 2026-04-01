'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Info, RefreshCw, Sparkles } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercent, getPriceImpactColor } from '@/lib/formatters';
import { useSettingsStore } from '@/store/settingsStore';
import type { TokenInfo } from '@/config/tokens';

interface SwapDetailsProps {
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  route: string[];
  getToken: (address: string) => TokenInfo | undefined;
  isLoading?: boolean;
  aiInsight?: string | null;
}

export function SwapDetails({
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  priceImpact,
  route,
  getToken,
  isLoading = false,
  aiInsight,
}: SwapDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rateInverted, setRateInverted] = useState(false);
  const slippage = useSettingsStore((s) => s.slippage);

  const rate = useMemo(() => {
    const inVal = parseFloat(amountIn);
    const outVal = parseFloat(amountOut);
    if (!inVal || !outVal || !tokenIn || !tokenOut) return null;
    if (rateInverted) {
      return {
        value: formatNumber(inVal / outVal),
        label: `1 ${tokenOut.symbol} = ${formatNumber(inVal / outVal)} ${tokenIn.symbol}`,
      };
    }
    return {
      value: formatNumber(outVal / inVal),
      label: `1 ${tokenIn.symbol} = ${formatNumber(outVal / inVal)} ${tokenOut.symbol}`,
    };
  }, [amountIn, amountOut, tokenIn, tokenOut, rateInverted]);

  const minReceived = useMemo(() => {
    const outVal = parseFloat(amountOut);
    if (!outVal) return '0';
    const slippageFactor = 1 - slippage / 10000;
    return formatNumber(outVal * slippageFactor);
  }, [amountOut, slippage]);

  const feePercent = useMemo(() => {
    if (route.length <= 2) return '0.30';
    return (0.3 * (route.length - 1)).toFixed(2);
  }, [route]);

  const impactColor = getPriceImpactColor(priceImpact);

  if (!tokenIn || !tokenOut || !parseFloat(amountIn) || !parseFloat(amountOut)) {
    return null;
  }

  return (
    <div className="mt-3">
        <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'input-sunken w-full flex items-center justify-between px-3.5 py-2.5 transition-all duration-200',
          'hover:bg-[rgba(6,10,19,0.6)]'
        )}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          ) : (
            <Info className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          )}
          {rate && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)] tabular-nums">
                {rate.label}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRateInverted(!rateInverted);
                }}
                className="p-0.5 rounded hover:bg-[rgba(30,41,59,0.5)] transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-[var(--color-text-muted)]" />
              </button>
            </div>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="input-sunken mt-2 p-3.5 space-y-2.5">
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

              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">{t('swap.fee')}</span>
                <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
                  {feePercent}%
                </span>
              </div>

              {route.length > 0 && (
                <div className="pt-2.5 border-t border-[rgba(56,189,248,0.04)]">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] mb-2.5 block uppercase tracking-wider">
                    {t('swap.route')}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {route.map((addr, idx) => {
                      const tok = getToken(addr);
                      return (
                        <div key={addr} className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgba(15,23,42,0.6)] border border-[rgba(56,189,248,0.06)]">
                            <TokenIcon address={addr} symbol={tok?.symbol || '?'} logoURI={tok?.logoURI} size="xs" />
                            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                              {tok?.symbol || addr.slice(0, 6)}
                            </span>
                          </div>
                          {idx < route.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-[var(--color-primary)]/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {aiInsight && (
                <div className="pt-2.5 border-t border-[rgba(56,189,248,0.04)]">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <p className="text-xs gradient-text leading-relaxed line-clamp-2">
                      {aiInsight}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
