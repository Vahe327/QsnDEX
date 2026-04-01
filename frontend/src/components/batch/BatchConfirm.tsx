'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, Zap, ArrowRight } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { useTokens } from '@/hooks/useTokens';
import type { BatchOrderQuote } from '@/lib/api';

interface BatchConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tokenIn: string;
  amountIn: string;
  orders: BatchOrderQuote[];
  gasSavings: number;
}

export function BatchConfirm({
  isOpen,
  onClose,
  onConfirm,
  tokenIn,
  amountIn,
  orders,
  gasSavings,
}: BatchConfirmProps) {
  const { getToken } = useTokens();
  const tokenInInfo = tokenIn ? getToken(tokenIn) : undefined;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'card relative z-10 w-full max-w-md p-5'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
              >
                {t('batch.confirmTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  'transition-colors duration-150 cursor-pointer'
                )}
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p
              className="text-sm mb-4"
              style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
            >
              {t('batch.confirmDesc')}
            </p>

            <div
              className="rounded-xl border p-3 mb-3"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
              >
                {t('batch.totalSpend')}
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                {tokenInInfo && (
                  <TokenIcon address={tokenInInfo.address} symbol={tokenInInfo.symbol} logoURI={tokenInInfo.logoURI} size="md" />
                )}
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
                >
                  {amountIn}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                >
                  {tokenInInfo?.symbol ?? ''}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center my-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <ArrowDown size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
            </div>

            <div
              className="rounded-xl border p-3 mb-4"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
              >
                {t('batch.expectedOutputs')}
              </span>
              <div className="mt-2 space-y-2.5">
                {orders.map((order, idx) => {
                  const outToken = getToken(order.token_out);
                  const outAmount = parseFloat(order.amount_out);
                  const pctDisplay = (order.percentage).toFixed(1);
                  return (
                    <motion.div
                      key={`${order.token_out}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {outToken && (
                          <TokenIcon address={outToken.address} symbol={outToken.symbol} logoURI={outToken.logoURI} size="sm" />
                        )}
                        <div className="flex flex-col">
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
                          >
                            {outToken?.symbol ?? order.token_out_symbol}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                          >
                            {pctDisplay}% {t('batch.of')} {t('batch.totalSpend').toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight size={12} style={{ color: 'var(--text-secondary)' }} />
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
                        >
                          {formatNumber(outAmount)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {gasSavings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.25 }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                }}
              >
                <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--accent-primary)', textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {t('batch.savedGas', { pct: gasSavings.toFixed(1) })}
                </span>
              </motion.div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex-1 rounded-xl py-3 text-sm font-semibold',
                  'border transition-colors duration-200 cursor-pointer',
                  'hover:brightness-110'
                )}
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {t('batch.cancel')}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  'flex-1 rounded-xl py-3 text-sm font-bold',
                  'transition-all duration-200 cursor-pointer',
                  'hover:brightness-110 hover:shadow-lg'
                )}
                style={{
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {t('batch.confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
