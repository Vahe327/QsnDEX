'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  Plus,
  Divide,
  Loader2,
  AlertTriangle,
  Wallet,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { parseUnits } from 'viem';
import { TokenIcon } from '@/components/common/TokenIcon';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useChainStore } from '@/store/chainStore';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { useTokens } from '@/hooks/useTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApprove } from '@/hooks/useApprove';
import { useChain } from '@/hooks/useChain';
import { useBatchQuote, useBatchBuildTx } from '@/hooks/useBatchSwap';
import { NATIVE_ETH } from '@/config/tokens';
import type { TokenInfo } from '@/config/tokens';
import type { BatchQuoteRequest, BatchOrderQuote, BatchBuildTxRequest } from '@/lib/api';
import { BatchTokenRow, type BatchOrderState } from './BatchTokenRow';
import { BatchSummary } from './BatchSummary';
import { BatchConfirm } from './BatchConfirm';

const MAX_ORDERS = 10;
const DEFAULT_SLIPPAGE_BPS = 250;

function createEmptyOrder(): BatchOrderState {
  return { tokenOut: '', tokenOutSymbol: '', percentage: 0 };
}

export function BatchSwapCard() {
  const { address: account, isConnected } = useAccount();
  const selectedChainId = useChainStore((s) => s.selectedChainId);
  const publicClient = usePublicClient({ chainId: selectedChainId });
  const { contracts } = useChain();
  const { allTokens, getToken } = useTokens();
  const tokens: TokenInfo[] = allTokens;

  const [tokenIn, setTokenIn] = useState<string>(NATIVE_ETH.address);
  const [amountIn, setAmountIn] = useState<string>('');
  const [orders, setOrders] = useState<BatchOrderState[]>([createEmptyOrder()]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTokenInSelect, setShowTokenInSelect] = useState(false);
  const [tokenInSearch, setTokenInSearch] = useState('');
  const [executionError, setExecutionError] = useState<string | null>(null);
  const tokenInSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTokenInSelect) return;
    const handler = (e: MouseEvent) => {
      if (tokenInSelectRef.current && !tokenInSelectRef.current.contains(e.target as Node)) {
        setShowTokenInSelect(false);
        setTokenInSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTokenInSelect]);

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
    () =>
      orders.length > 0 &&
      orders.every((o) => o.tokenOut.length === 42 && o.percentage > 0),
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
    if (!tokenIn || !amountIn || parseFloat(amountIn) <= 0 || !percentageValid || !hasValidOrders) {
      return undefined;
    }
    return {
      token_in: tokenIn,
      amount_in: amountIn,
      orders: orders.map((o) => ({
        token_out: o.tokenOut,
        percentage: o.percentage / 100,
      })),
      slippage_bps: DEFAULT_SLIPPAGE_BPS,
    };
  }, [tokenIn, parsedAmountIn, percentageValid, hasValidOrders, orders]);

  const {
    data: quote,
    isLoading: isQuoting,
    error: quoteError,
  } = useBatchQuote(quoteRequest);

  const isNativeIn = tokenIn === NATIVE_ETH.address;
  const { needsApproval, approve, isApproving } = useApprove({
    tokenAddress: isNativeIn ? undefined : tokenIn || undefined,
    spenderAddress: contracts.batchSwap,
    amount: parsedAmountIn ? BigInt(parsedAmountIn) : 0n,
  });

  const buildTx = useBatchBuildTx();

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    reset: resetSend,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) {
      setShowConfirm(false);
      setAmountIn('');
      setOrders([createEmptyOrder()]);
      resetSend();
    }
  }, [isConfirmed, resetSend]);

  const handleUpdateOrder = useCallback(
    (index: number, field: keyof BatchOrderState, value: string | number) => {
      setOrders((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const handleRemoveOrder = useCallback((index: number) => {
    setOrders((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleAddOrder = useCallback(() => {
    setOrders((prev) => {
      if (prev.length >= MAX_ORDERS) return prev;
      return [...prev, createEmptyOrder()];
    });
  }, []);

  const handleEqualSplit = useCallback(() => {
    setOrders((prev) => {
      const count = prev.length;
      if (count === 0) return prev;
      const baseBps = Math.floor(10000 / count);
      const remainder = 10000 - baseBps * count;
      return prev.map((o, i) => ({
        ...o,
        percentage: baseBps + (i < remainder ? 1 : 0),
      }));
    });
  }, []);

  const handleAmountInChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > (tokenInInfo?.decimals ?? 18)) return;
    setAmountIn(cleaned);
  };

  const handleMaxAmount = () => {
    if (balanceIn) {
      setAmountIn(balanceIn);
    }
  };

  const handleExecuteClick = () => {
    setExecutionError(null);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!quote || !tokenIn || parsedAmountIn === '0') return;
    setExecutionError(null);

    try {
      if (!isNativeIn && needsApproval) {
        const approveTx = await approve();
        if (approveTx && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx as `0x${string}` });
        }
      }

      const buildRequest: BatchBuildTxRequest = {
        token_in: tokenIn,
        amount_in: amountIn,
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

      let gasOvr: Record<string, bigint> = {};
      if (publicClient) {
        try {
          const feeData = await publicClient.estimateFeesPerGas();
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            gasOvr = { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas };
          } else {
            const gp = await publicClient.getGasPrice();
            if (gp > 0n) gasOvr = { gasPrice: gp } as any;
          }
        } catch {}
      }

      let gasLimit: bigint | undefined;
      if (publicClient && account) {
        try {
          const estimated = await publicClient.estimateGas({
            account: account as `0x${string}`,
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: BigInt(txData.value),
          });
          gasLimit = estimated * 150n / 100n;
        } catch {}
      }

      sendTransaction({
        to: txData.to as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(txData.value),
        ...(gasLimit ? { gas: gasLimit } : {}),
        ...gasOvr,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setExecutionError(message);
    }
  };

  const filteredTokenInList = useMemo(() => {
    if (!tokenInSearch.trim()) return tokens;
    const q = tokenInSearch.toLowerCase();
    return tokens.filter(
      (tk) =>
        tk.symbol.toLowerCase().includes(q) ||
        tk.name.toLowerCase().includes(q) ||
        tk.address.toLowerCase().includes(q)
    );
  }, [tokens, tokenInSearch]);

  const buttonState = useMemo(() => {
    if (!isConnected) {
      return { disabled: true, label: t('batch.connectWallet'), variant: 'disabled' as const };
    }
    if (!amountIn || parsedAmountIn === '0') {
      return { disabled: true, label: t('batch.enterAmount'), variant: 'disabled' as const };
    }
    if (!hasEnoughBalance) {
      return {
        disabled: true,
        label: t('batch.insufficientBalance', { token: tokenInInfo?.symbol ?? '' }),
        variant: 'danger' as const,
      };
    }
    if (orders.length === 0 || !hasValidOrders) {
      return { disabled: true, label: t('batch.addAtLeastOne'), variant: 'disabled' as const };
    }
    if (!percentageValid) {
      return { disabled: true, label: t('batch.percentMustSum100'), variant: 'warning' as const };
    }
    if (isQuoting) {
      return { disabled: true, label: t('batch.quoting'), variant: 'loading' as const };
    }
    if (isSending || isConfirming) {
      return { disabled: true, label: t('batch.executing'), variant: 'loading' as const };
    }
    return { disabled: false, label: t('batch.execute'), variant: 'ready' as const };
  }, [
    isConnected,
    amountIn,
    parsedAmountIn,
    hasEnoughBalance,
    tokenInInfo,
    orders.length,
    hasValidOrders,
    percentageValid,
    isQuoting,
    isSending,
    isConfirming,
  ]);

  const quoteOrdersMap = useMemo(() => {
    if (!quote?.orders) return new Map<string, BatchOrderQuote>();
    const map = new Map<string, BatchOrderQuote>();
    for (const qo of quote.orders) {
      map.set(qo.token_out.toLowerCase(), qo);
    }
    return map;
  }, [quote]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'card p-5'
        )}
      >
        <h2
          className="text-xl font-bold mb-5"
          style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
        >
          {t('batch.title')}
        </h2>

        <div className="input-sunken p-4 mb-4">

          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
            >
              {t('batch.youPay')}
            </span>
            {isConnected && balanceIn && (
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-xs cursor-pointer transition-colors hover:brightness-110"
                style={{ color: 'var(--accent-primary)', textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)' }}
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
              className={cn(
                'flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none',
                'placeholder:opacity-30'
              )}
              style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
            />

            <div className="relative shrink-0" ref={tokenInSelectRef}>
              <button
                type="button"
                onClick={() => setShowTokenInSelect((prev) => !prev)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2.5',
                  'transition-all duration-200 cursor-pointer',
                  'hover:brightness-110'
                )}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {tokenInInfo && (
                  <TokenIcon address={tokenInInfo.address} symbol={tokenInInfo.symbol} logoURI={tokenInInfo.logoURI} size="sm" />
                )}
                <span className="text-sm font-semibold">
                  {tokenInInfo?.symbol ?? t('batch.selectToken')}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform duration-200',
                    showTokenInSelect && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {showTokenInSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border p-2',
                      'shadow-xl backdrop-blur-xl'
                    )}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div
                      className="flex items-center gap-2 rounded-lg border px-2 py-1.5 mb-2"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface-2)',
                      }}
                    >
                      <Search size={14} style={{ color: 'var(--text-secondary)', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />
                      <input
                        type="text"
                        value={tokenInSearch}
                        onChange={(e) => setTokenInSearch(e.target.value)}
                        placeholder={t('swap.searchTokenPlaceholder')}
                        className="w-full bg-transparent text-sm outline-none"
                        style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                      {filteredTokenInList.length === 0 ? (
                        <div
                          className="px-3 py-4 text-center text-sm"
                          style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                        >
                          {t('swap.noTokensFound')}
                        </div>
                      ) : (
                        filteredTokenInList.map((token) => {
                          const isSelected =
                            token.address.toLowerCase() === tokenIn.toLowerCase();
                          return (
                            <button
                              key={token.address}
                              type="button"
                              onClick={() => {
                                setTokenIn(token.address);
                                setShowTokenInSelect(false);
                                setTokenInSearch('');
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm',
                                'transition-colors duration-150 cursor-pointer'
                              )}
                              style={{
                                color: 'var(--text-primary)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)',
                                backgroundColor: isSelected
                                  ? 'var(--bg-surface-2)'
                                  : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor =
                                    'var(--bg-surface-2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <TokenIcon address={token.address} symbol={token.symbol} logoURI={token.logoURI} size="sm" />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{token.symbol}</span>
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                                >
                                  {token.name}
                                </span>
                              </div>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="ml-auto"
                                  style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 4px rgba(240,180,41,0.3))' }}
                                />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!hasEnoughBalance && amountIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-1.5 mt-2"
            >
              <AlertTriangle size={12} style={{ color: 'var(--accent-danger)' }} />
              <span className="text-xs" style={{ color: 'var(--accent-danger)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                {t('batch.insufficientBalance', { token: tokenInInfo?.symbol ?? '' })}
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center justify-center -my-1 relative z-10">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #1A1D28 0%, #0C0D12 100%)',
              border: '1px solid rgba(240,180,41,0.12)',
              borderTopColor: 'rgba(255,255,255,0.06)',
              borderBottomColor: 'rgba(0,0,0,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.15)',
            }}
          >
            <ArrowDown size={16} style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 4px rgba(240,180,41,0.3))' }} />
          </div>
        </div>

        <div className="input-sunken p-4 mt-4">

          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
            >
              {t('batch.splitInto')}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn('text-xs font-medium tabular-nums')}
                style={{
                  color: percentageValid
                    ? 'var(--accent-primary)'
                    : totalPercentage > 10000
                      ? 'var(--accent-danger)'
                      : 'var(--accent-warning)',
                  textShadow: percentageValid
                    ? '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)'
                    : '0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                {(totalPercentage / 100).toFixed(2)}% / 100%
              </span>
              <button
                type="button"
                onClick={handleEqualSplit}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium',
                  'border transition-colors duration-200 cursor-pointer',
                  'hover:brightness-110'
                )}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)',
                  textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                <Divide size={12} />
                {t('batch.equalSplit')}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {orders.map((order, idx) => {
                const quoteOrder = quoteOrdersMap.get(order.tokenOut.toLowerCase());
                return (
                  <BatchTokenRow
                    key={`order-${idx}`}
                    index={idx}
                    order={order}
                    tokens={tokens}
                    onUpdate={handleUpdateOrder}
                    onRemove={handleRemoveOrder}
                    quoteAmount={
                      quoteOrder
                        ? `${formatNumber(parseFloat(quoteOrder.amount_out))} ${quoteOrder.token_out_symbol}`
                        : undefined
                    }
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {orders.length < MAX_ORDERS && (
            <motion.button
              type="button"
              onClick={handleAddOrder}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 mt-3',
                'border border-dashed transition-colors duration-200 cursor-pointer',
                'hover:brightness-110'
              )}
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-primary)',
                backgroundColor: 'transparent',
                textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              <Plus size={16} />
              <span className="text-sm font-medium">{t('batch.addToken')}</span>
            </motion.button>
          )}

          {orders.length >= MAX_ORDERS && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
            >
              {t('batch.maxTokens')}
            </p>
          )}

          {!percentageValid && hasValidOrders && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 mt-3"
            >
              <AlertTriangle size={12} style={{ color: 'var(--accent-warning)' }} />
              <span className="text-xs" style={{ color: 'var(--accent-warning)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                {t('batch.percentMustSum100')}
              </span>
            </motion.div>
          )}
        </div>

        {quote && (
          <div className="mt-4">
            <BatchSummary
              batchGas={quote.total_gas_estimated}
              separateGas={quote.gas_vs_separate}
              gasSavingsPct={quote.gas_savings_pct}
              gasCostUsd={quote.gas_cost_usd}
            />
          </div>
        )}

        {isQuoting && (
          <div className="flex items-center justify-center gap-2 mt-4 py-2">
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: 'var(--accent-primary)' }}
            />
            <span
              className="text-sm"
              style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
            >
              {t('batch.quoting')}
            </span>
          </div>
        )}

        {quoteError && !isQuoting && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
            }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--accent-danger)' }} />
            <span className="text-xs" style={{ color: 'var(--accent-danger)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              {t('batch.noQuote')}
            </span>
          </div>
        )}

        {executionError && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
            }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--accent-danger)' }} />
            <span className="text-xs break-all" style={{ color: 'var(--accent-danger)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              {executionError}
            </span>
          </div>
        )}

        <motion.button
          type="button"
          onClick={handleExecuteClick}
          disabled={buttonState.disabled}
          whileHover={buttonState.disabled ? undefined : { scale: 1.01 }}
          whileTap={buttonState.disabled ? undefined : { scale: 0.98 }}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl py-4 mt-4',
            'text-base font-bold transition-all duration-200',
            buttonState.disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:shadow-lg hover:brightness-110'
          )}
          style={{
            background:
              buttonState.variant === 'danger'
                ? 'linear-gradient(180deg, #F87171 0%, #EF4444 40%, #DC2626 100%)'
                : buttonState.variant === 'warning'
                  ? 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 40%, #D97706 100%)'
                  : buttonState.variant === 'ready'
                    ? 'linear-gradient(180deg, #FBBF24 0%, #F0B429 20%, #D97706 80%, #B45309 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, var(--bg-surface-2) 15%, var(--bg-surface-2) 85%, rgba(0,0,0,0.1) 100%)',
            color:
              buttonState.variant === 'ready'
                ? '#0E1015'
                : buttonState.variant === 'danger' || buttonState.variant === 'warning'
                  ? '#fff'
                  : 'var(--text-secondary)',
            textShadow:
              buttonState.variant === 'ready'
                ? '0 1px 0 rgba(255,255,255,0.2)'
                : buttonState.variant === 'danger' || buttonState.variant === 'warning'
                  ? '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)'
                  : '0 1px 1px rgba(0,0,0,0.35)',
            boxShadow:
              buttonState.variant === 'ready'
                ? '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(240,180,41,0.25), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)'
                : buttonState.variant === 'danger'
                  ? '0 4px 12px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)'
                  : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(0,0,0,0.15)',
          }}
        >
          {(buttonState.variant === 'loading') && (
            <Loader2 size={18} className="animate-spin" />
          )}
          {!isConnected && <Wallet size={18} />}
          {buttonState.label}
        </motion.button>
      </motion.div>

      <BatchConfirm
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setExecutionError(null);
        }}
        onConfirm={handleConfirm}
        tokenIn={tokenIn}
        amountIn={amountIn}
        orders={quote?.orders ?? []}
        gasSavings={quote?.gas_savings_pct ?? 0}
      />
    </div>
  );
}
