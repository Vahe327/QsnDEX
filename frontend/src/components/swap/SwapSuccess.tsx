'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { getExplorerUrl, shortenAddress, formatNumber } from '@/lib/formatters';
import type { TokenInfo } from '@/config/tokens';

interface SwapSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  amountIn: string;
  amountOut: string;
}

export function SwapSuccess({
  isOpen,
  onClose,
  txHash,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
}: SwapSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [txHash]);

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-sm"
          >
            <div className="flex items-center justify-end p-4">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(30,41,59,0.5)] transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, duration: 0.5 }}
                className="inline-flex mb-5"
              >
                <div className="w-20 h-20 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-[var(--color-success)]" />
                  </motion.div>
                </div>
              </motion.div>

              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                {t('swap.swapSuccessful')}
              </h3>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="input-sunken mt-4 p-4"
              >
                <div className="flex items-center justify-center gap-3">
                  {tokenIn && (
                    <div className="flex items-center gap-2">
                      <TokenIcon address={tokenIn.address} symbol={tokenIn.symbol} logoURI={tokenIn.logoURI} size="md" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[var(--color-danger)] font-[var(--font-mono)]">
                          -{formatNumber(amountIn)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{tokenIn.symbol}</p>
                      </div>
                    </div>
                  )}
                  <div className="text-[var(--color-text-muted)] text-lg">&rarr;</div>
                  {tokenOut && (
                    <div className="flex items-center gap-2">
                      <TokenIcon address={tokenOut.address} symbol={tokenOut.symbol} logoURI={tokenOut.logoURI} size="md" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[var(--color-success)] font-[var(--font-mono)]">
                          +{formatNumber(amountOut)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{tokenOut.symbol}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span className="font-[var(--font-mono)]">{shortenAddress(txHash)}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-lg hover:bg-[rgba(30,41,59,0.5)] transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200',
                    'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('swap.viewOnExplorer')}
                </a>
                <button
                  onClick={onClose}
                  className="py-3 rounded-xl bg-[rgba(30,41,59,0.5)] hover:bg-[rgba(30,41,59,0.7)] text-[var(--color-text)] font-semibold transition-all duration-200"
                >
                  {t('swap.close')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
