'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  Plus,
  Divide,
  Layers,
  Loader2,
  AlertTriangle,
  Wallet,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { parseUnits } from 'viem';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { useTokens } from '@/hooks/useTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useBatchQuote, useBatchBuildTx } from '@/hooks/useBatchSwap';
import { NATIVE_ETH } from '@/config/tokens';
import type { TokenInfo } from '@/config/tokens';
import type { BatchQuoteRequest, BatchOrderQuote, BatchBuildTxRequest } from '@/lib/api';
import { TokenIcon } from '@/components/common/TokenIcon';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { BatchSummary } from '@/components/batch/BatchSummary';
import { BatchConfirm } from '@/components/batch/BatchConfirm';

const MAX_ORDERS = 10;
const DEFAULT_SLIPPAGE_BPS = 50;

interface BatchOrderState {
  tokenOut: string;
  tokenOutSymbol: string;
  percentage: number;
}

function createEmptyOrder(): BatchOrderState {
  return { tokenOut: '', tokenOutSymbol: '', percentage: 0 };
}

export function MobileBatch() {
  const { address: account, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { allTokens, getToken } = useTokens();
  const tokens: TokenInfo[] = allTokens;

  const [tokenIn, setTokenIn] = useState<string>(NATIVE_ETH.address);
  const [amountIn, setAmountIn] = useState<string>('');
  const [orders, setOrders] = useState<BatchOrderState[]>([createEmptyOrder()]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<'in' | number>('in');
  const [executionError, setExecutionError] = useState<string | null>(null);

  const tokenInInfo = useMemo(
    () => (tokenIn ? getToken(tokenIn) ?? NATIVE_ETH : NATIVE_ETH),
    [tokenIn, getToken]
  );

  const { balance: balanceInRaw, formatted: balanceIn } = useTokenBalance({
    tokenAddress: tokenIn || undefined,
    decimals: tokenInInfo?.decimals,
    watch: true,
  });

  const totalPercentage = useMemo(
    () => orders.reduce((sum, o) => sum + o.percentage, 0),
    [orders]
  );

  const percentageValid = totalPercentage === 10000;

  const hasValidOrders = useMemo(
    () => orders.length > 0 && orders.every((o) => o.tokenOut.length === 42 && o.percentage > 0),
    [orders]
  );

  const parsedAmountIn = useMemo(() => {
    if (!amountIn || !tokenInInfo) return '0';
    try {
      return parseUnits(amountIn, tokenInInfo.decimals).toString();
    } catch {
      return '0';
    }
  }, [amountIn, tokenInInfo]);

  const hasEnoughBalance = useMemo(() => {
    if (!balanceInRaw || parsedAmountIn === '0') return true;
    try {
      return balanceInRaw >= BigInt(parsedAmountIn);
    } catch {
      return true;
    }
  }, [balanceInRaw, parsedAmountIn]);

  const quoteRequest: BatchQuoteRequest | undefined = useMemo(() => {
    if (!tokenIn || parsedAmountIn === '0' || !percentageValid || !hasValidOrders) return undefined;
    return {
      token_in: tokenIn,
      amount_in: parsedAmountIn,
      orders: orders.map((o) => ({ token_out: o.tokenOut, percentage: o.percentage / 100 })),
      slippage_bps: DEFAULT_SLIPPAGE_BPS,
    };
  }, [tokenIn, parsedAmountIn, percentageValid, hasValidOrders, orders]);

  const { data: quote, isLoading: isQuoting, error: quoteError } = useBatchQuote(quoteRequest);
  const buildTx = useBatchBuildTx();
  const { sendTransaction, data: txHash, isPending: isSending, reset: resetSend } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) {
      setShowConfirm(false);
      setAmountIn('');
      setOrders([createEmptyOrder()]);
      resetSend();
    }
  }, [isConfirmed, resetSend]);

  const handleAmountInChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > (tokenInInfo?.decimals ?? 18)) return;
    setAmountIn(cleaned);
  };

  const handleAddOrder = useCallback(() => {
    setOrders((prev) => (prev.length >= MAX_ORDERS ? prev : [...prev, createEmptyOrder()]));
  }, []);

  const handleRemoveOrder = useCallback((index: number) => {
    setOrders((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const handleEqualSplit = useCallback(() => {
    setOrders((prev) => {
      const count = prev.length;
      if (count === 0) return prev;
      const baseBps = Math.floor(10000 / count);
      const remainder = 10000 - baseBps * count;
      return prev.map((o, i) => ({ ...o, percentage: baseBps + (i < remainder ? 1 : 0) }));
    });
  }, []);

  const handleTokenSelect = useCallback(
    (token: { address: string }) => {
      if (selectorTarget === 'in') {
        setTokenIn(token.address);
      } else {
        const info = getToken(token.address);
        setOrders((prev) => {
          const next = [...prev];
          next[selectorTarget] = {
            ...next[selectorTarget],
            tokenOut: token.address,
            tokenOutSymbol: info?.symbol ?? '',
          };
          return next;
        });
      }
      setSelectorOpen(false);
    },
    [selectorTarget, getToken]
  );

  const handlePercentageChange = useCallback((index: number, value: number) => {
    setOrders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], percentage: value };
      return next;
    });
  }, []);

  const handleConfirm = async () => {
    if (!quote || !tokenIn || parsedAmountIn === '0') return;
    setExecutionError(null);
    try {
      const buildRequest: BatchBuildTxRequest = {
        token_in: tokenIn,
        amount_in: parsedAmountIn,
        orders: quote.orders.map((qo: BatchOrderQuote) => ({
          token_out: qo.token_out,
          percentage: qo.percentage,
          amount_out_min: qo.amount_out_min,
          path: [tokenIn, qo.token_out],
        })),
        slippage_bps: DEFAULT_SLIPPAGE_BPS,
        sender: account as string,
        deadline: Math.floor(Date.now() / 1000) + 1200,
      };
      const result = await buildTx.mutateAsync(buildRequest);
      const txData = result.tx;
      sendTransaction({
        to: txData.to as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(txData.value),
        gas: BigInt(Math.ceil(txData.gas_estimate * 1.2)),
      });
    } catch (err: unknown) {
      setExecutionError(err instanceof Error ? err.message : String(err));
    }
  };

  const quoteOrdersMap = useMemo(() => {
    if (!quote?.orders) return new Map<string, BatchOrderQuote>();
    const map = new Map<string, BatchOrderQuote>();
    for (const qo of quote.orders) map.set(qo.token_out.toLowerCase(), qo);
    return map;
  }, [quote]);

  const buttonState = useMemo(() => {
    if (!isConnected) return { disabled: true, label: t('batch.connectWallet'), action: 'connect' as const };
    if (!amountIn || parsedAmountIn === '0') return { disabled: true, label: t('batch.enterAmount'), action: 'none' as const };
    if (!hasEnoughBalance) return { disabled: true, label: t('batch.insufficientBalance', { token: tokenInInfo?.symbol ?? '' }), action: 'none' as const };
    if (!hasValidOrders) return { disabled: true, label: t('batch.addAtLeastOne'), action: 'none' as const };
    if (!percentageValid) return { disabled: true, label: t('batch.percentMustSum100'), action: 'none' as const };
    if (isQuoting) return { disabled: true, label: t('batch.quoting'), action: 'none' as const };
    if (isSending || isConfirming) return { disabled: true, label: t('batch.executing'), action: 'none' as const };
    return { disabled: false, label: t('batch.execute'), action: 'execute' as const };
  }, [isConnected, amountIn, parsedAmountIn, hasEnoughBalance, tokenInInfo, hasValidOrders, percentageValid, isQuoting, isSending, isConfirming]);

  return (
    <div className="px-3 pt-3 pb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))' }}
        >
          <Layers className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
          {t('batch.title')}
        </h1>
      </div>

      <div
        className="rounded-2xl p-4 mb-3"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
            {t('batch.youPay')}
          </span>
          {isConnected && balanceIn && (
            <button
              onClick={() => setAmountIn(balanceIn)}
              className="text-xs font-bold"
              style={{ color: 'var(--accent-primary)' }}
            >
              MAX: {formatNumber(parseFloat(balanceIn))}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={amountIn}
            onChange={(e) => handleAmountInChange(e.target.value)}
            placeholder="0.0"
            className="flex-1 min-w-0 bg-transparent text-xl font-bold font-[var(--font-mono)] outline-none min-h-[44px]"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => { setSelectorTarget('in'); setSelectorOpen(true); }}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 shrink-0 min-h-[44px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            {tokenInInfo && (
              <TokenIcon address={tokenInInfo.address} symbol={tokenInInfo.symbol} logoURI={tokenInInfo.logoURI} size="sm" />
            )}
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {tokenInInfo?.symbol ?? t('batch.selectToken')}
            </span>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
        {!hasEnoughBalance && amountIn && (
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle className="w-3 h-3" style={{ color: 'var(--accent-danger)' }} />
            <span className="text-xs" style={{ color: 'var(--accent-danger)' }}>
              {t('batch.insufficientBalance', { token: tokenInInfo?.symbol ?? '' })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center -my-1 relative z-10">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-glow)',
          }}
        >
          <ArrowDown className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </div>

      <div
        className="rounded-2xl p-4 mt-3 mb-3"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
            {t('batch.splitInto')}
          </span>
          <div className="flex gap-2">
            <span
              className="text-xs font-bold font-[var(--font-mono)]"
              style={{ color: percentageValid ? 'var(--accent-tertiary)' : 'var(--accent-warning)' }}
            >
              {(totalPercentage / 100).toFixed(0)}%
            </span>
            <button
              onClick={handleEqualSplit}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold min-h-[28px]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--accent-primary)' }}
            >
              <Divide className="w-3 h-3" />
              {t('batch.equalSplit')}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {orders.map((order, idx) => {
            const orderTokenInfo = order.tokenOut ? getToken(order.tokenOut) : null;
            const quoteOrder = quoteOrdersMap.get(order.tokenOut.toLowerCase());

            return (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-xl p-2.5"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <button
                  onClick={() => { setSelectorTarget(idx); setSelectorOpen(true); }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg shrink-0 min-h-[36px]"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
                >
                  {orderTokenInfo ? (
                    <>
                      <TokenIcon symbol={orderTokenInfo.symbol} logoURI={orderTokenInfo.logoURI} size="xs" />
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {orderTokenInfo.symbol}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {t('batch.selectToken')}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                </button>

                <div className="flex items-center gap-0.5 flex-1 min-w-0">
                  <input
                    type="number"
                    value={order.percentage ? (order.percentage / 100).toFixed(0) : ''}
                    onChange={(e) => handlePercentageChange(idx, Math.min(10000, Math.max(0, parseInt(e.target.value || '0') * 100)))}
                    className="w-12 bg-transparent text-center text-sm font-bold font-[var(--font-mono)] outline-none min-h-[36px]"
                    style={{ color: 'var(--text-primary)' }}
                    placeholder="0"
                  />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>%</span>
                </div>

                {quoteOrder && (
                  <span className="text-[10px] font-[var(--font-mono)] truncate" style={{ color: 'var(--text-secondary)' }}>
                    ~{formatNumber(parseFloat(quoteOrder.amount_out))}
                  </span>
                )}

                {orders.length > 1 && (
                  <button
                    onClick={() => handleRemoveOrder(idx)}
                    className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {orders.length < MAX_ORDERS && (
          <button
            onClick={handleAddOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 mt-2 min-h-[44px]"
            style={{ border: '1px dashed var(--border-subtle)', color: 'var(--accent-primary)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">{t('batch.addToken')}</span>
          </button>
        )}
      </div>

      {quote && (
        <div className="mb-3">
          <BatchSummary
            batchGas={quote.total_gas_estimated}
            separateGas={quote.gas_vs_separate}
            gasSavingsPct={quote.gas_savings_pct}
            gasCostUsd={quote.gas_cost_usd}
          />
        </div>
      )}

      {isQuoting && (
        <div className="flex items-center justify-center gap-2 py-3 mb-3">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('batch.quoting')}</span>
        </div>
      )}

      {(quoteError || executionError) && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-danger)' }} />
          <span className="text-xs" style={{ color: 'var(--accent-danger)' }}>
            {executionError || t('batch.noQuote')}
          </span>
        </div>
      )}

      <button
        onClick={() => {
          if (buttonState.action === 'connect') {
            openConnectModal?.();
          } else if (buttonState.action === 'execute') {
            setExecutionError(null);
            setShowConfirm(true);
          }
        }}
        disabled={buttonState.disabled && buttonState.action !== 'connect'}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold min-h-[48px] transition-all',
          buttonState.disabled && buttonState.action !== 'connect'
            ? 'opacity-50'
            : 'active:scale-[0.98]'
        )}
        style={{
          background: !buttonState.disabled || buttonState.action === 'connect'
            ? 'var(--gradient-primary)'
            : 'var(--bg-surface-2)',
          color: !buttonState.disabled || buttonState.action === 'connect'
            ? '#000'
            : 'var(--text-tertiary)',
          boxShadow: !buttonState.disabled ? 'var(--glow-gold)' : 'none',
        }}
      >
        {(isSending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
        {buttonState.action === 'connect' && <Wallet className="w-4 h-4" />}
        {buttonState.label}
      </button>

      <TokenSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleTokenSelect}
      />

      <BatchConfirm
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setExecutionError(null); }}
        onConfirm={handleConfirm}
        tokenIn={tokenIn}
        amountIn={amountIn}
        orders={quote?.orders ?? []}
        gasSavings={quote?.gas_savings_pct ?? 0}
      />
    </div>
  );
}
