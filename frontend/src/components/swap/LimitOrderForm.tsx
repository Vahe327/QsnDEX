'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Loader2, ArrowDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { api } from '@/lib/api';
import { useSwapStore } from '@/store/swapStore';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { useChain } from '@/hooks/useChain';
import { useApprove } from '@/hooks/useApprove';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { NATIVE_ETH } from '@/config/tokens';
import type { TokenInfo } from '@/config/tokens';
import { TokenInput } from './TokenInput';

const LIMIT_ORDER_ABI = [
  {
    type: 'function',
    name: 'placeOrder',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'orderId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const;

const DEADLINE_OPTIONS = [
  { label: '1h', value: 60 },
  { label: '24h', value: 1440 },
  { label: '7d', value: 10080 },
  { label: '30d', value: 43200 },
];

interface LimitOrderFormProps {
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  onSelectTokenIn: () => void;
  onSelectTokenOut: () => void;
}

export function LimitOrderForm({
  tokenIn,
  tokenOut,
  onSelectTokenIn,
  onSelectTokenOut,
}: LimitOrderFormProps) {
  const { address: account } = useAccount();
  const { contracts, chainId } = useChain();
  const publicClient = usePublicClient({ chainId });
  const { amountIn, setAmountIn, limitPrice, setLimitPrice } = useSwapStore();

  const [deadlineMinutes, setDeadlineMinutes] = useState(1440);
  const [txError, setTxError] = useState<string | null>(null);
  const [priceAutoFilled, setPriceAutoFilled] = useState(false);

  const resolveAddr = (tok: TokenInfo | null) => {
    if (!tok) return undefined;
    if (tok.address.toLowerCase() === NATIVE_ETH.address.toLowerCase()) return contracts.weth;
    return tok.address;
  };
  const resolvedIn = resolveAddr(tokenIn);
  const resolvedOut = resolveAddr(tokenOut);

  const { data: marketQuote } = useQuery({
    queryKey: ['limitMarketPrice', chainId, resolvedIn, resolvedOut],
    queryFn: async () => {
      if (!resolvedIn || !resolvedOut || !tokenIn) return null;
      const oneUnit = parseUnits('1', tokenIn.decimals).toString();
      const { quote } = await api.getSwapQuote(resolvedIn, resolvedOut, oneUnit, 50, chainId);
      return quote;
    },
    enabled: !!resolvedIn && !!resolvedOut && !!tokenIn,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (marketQuote && tokenOut && !priceAutoFilled && !limitPrice) {
      const amountOutWei = (marketQuote as any).amount_out?.split('.')[0] || '0';
      if (amountOutWei !== '0') {
        const priceStr = formatUnits(BigInt(amountOutWei), tokenOut.decimals);
        const priceNum = parseFloat(priceStr);
        if (priceNum > 0) {
          setLimitPrice(formatNumber(priceNum));
          setPriceAutoFilled(true);
        }
      }
    }
  }, [marketQuote, tokenOut, priceAutoFilled, limitPrice, setLimitPrice]);

  useEffect(() => {
    setPriceAutoFilled(false);
  }, [resolvedIn, resolvedOut]);

  const { balance: balanceInRaw, formatted: balanceIn } = useTokenBalance({
    tokenAddress: tokenIn?.address,
    decimals: tokenIn?.decimals,
    watch: true,
  });

  const amountInWei = useMemo(() => {
    if (!amountIn || !tokenIn) return 0n;
    try {
      return parseUnits(amountIn, tokenIn.decimals);
    } catch {
      return 0n;
    }
  }, [amountIn, tokenIn]);

  const isNativeIn = tokenIn?.address.toLowerCase() === NATIVE_ETH.address.toLowerCase();

  const { needsApproval, approve, isApproving } = useApprove({
    tokenAddress: isNativeIn ? undefined : tokenIn?.address,
    spenderAddress: contracts.limitOrder,
    amount: amountInWei,
  });

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const estimatedOut = useMemo(() => {
    const inVal = parseFloat(amountIn);
    const price = parseFloat(limitPrice);
    if (!inVal || !price) return '';
    return formatNumber(inVal * price);
  }, [amountIn, limitPrice]);

  const isValid = useMemo(() => {
    if (!account || !tokenIn || !tokenOut) return false;
    if (isNativeIn) return false;
    if (!amountIn || parseFloat(amountIn) <= 0) return false;
    if (!limitPrice || parseFloat(limitPrice) <= 0) return false;
    if (amountInWei > balanceInRaw) return false;
    return true;
  }, [account, tokenIn, tokenOut, amountIn, limitPrice, amountInWei, balanceInRaw, isNativeIn]);

  const handlePlaceOrder = useCallback(async () => {
    if (!isValid || !tokenIn || !tokenOut) return;
    setTxError(null);

    try {
      if (needsApproval) {
        const approveTx = await approve();
        if (approveTx && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx as Address });
        }
      }

      const inVal = parseFloat(amountIn);
      const price = parseFloat(limitPrice);
      const minOut = (inVal * price).toString();
      const minAmountOutWei = parseUnits(minOut, tokenOut.decimals);
      const deadlineTimestamp = BigInt(
        Math.floor(Date.now() / 1000) + deadlineMinutes * 60
      );

      let gasOverrides: Record<string, bigint> = {};
      if (publicClient) {
        try {
          const feeData = await publicClient.estimateFeesPerGas();
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            gasOverrides = {
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            };
          } else {
            const gasPrice = await publicClient.getGasPrice();
            if (gasPrice > 0n) {
              gasOverrides = { gasPrice } as any;
            }
          }
        } catch {}
      }

      await writeContractAsync({
        address: contracts.limitOrder as Address,
        abi: LIMIT_ORDER_ABI,
        functionName: 'placeOrder',
        args: [
          tokenIn.address as Address,
          tokenOut.address as Address,
          amountInWei,
          minAmountOutWei,
          deadlineTimestamp,
        ],
        ...gasOverrides,
      });
    } catch (err) {
      setTxError(err instanceof Error ? err.message : t('swap.orderCreationFailed'));
    }
  }, [
    isValid, tokenIn, tokenOut, amountIn, limitPrice,
    amountInWei, deadlineMinutes, needsApproval, approve, writeContractAsync,
  ]);

  const isProcessing = isPending || isConfirming || isApproving;

  const buttonText = useMemo(() => {
    if (!account) return t('swap.connectWallet');
    if (!tokenIn || !tokenOut) return t('swap.selectToken');
    if (isNativeIn) return t('swap.useWethForLimit');
    if (!amountIn || parseFloat(amountIn) <= 0) return t('swap.enterAmount');
    if (!limitPrice || parseFloat(limitPrice) <= 0) return t('swap.enterPrice');
    if (amountInWei > balanceInRaw) return t('swap.insufficientBalance', { token: tokenIn.symbol });
    if (isApproving) return t('swap.approving');
    if (isPending || isConfirming) return t('swap.placingOrder');
    return t('swap.placeOrder');
  }, [
    account, tokenIn, tokenOut, amountIn, limitPrice,
    amountInWei, balanceInRaw, isApproving, isPending, isConfirming, isNativeIn,
  ]);

  return (
    <div className="space-y-3">
      <TokenInput
        label={t('swap.youPay')}
        amount={amountIn}
        onAmountChange={setAmountIn}
        token={tokenIn}
        onTokenSelect={onSelectTokenIn}
        balance={balanceIn}
        balanceRaw={balanceInRaw}
      />

      <div className="flex justify-center -my-1">
        <div className="w-10 h-10 rounded-full bg-[rgba(15,23,42,0.8)] border border-[rgba(6,182,212,0.1)] flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.06)]">
          <ArrowDown className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      </div>

      <div className="input-sunken p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('swap.youReceive')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[28px] font-semibold text-[var(--color-text)] font-[var(--font-mono)] tabular-nums truncate leading-tight">
              {estimatedOut || '0.0'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('swap.estimatedAtTargetPrice')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSelectTokenOut}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-2xl shrink-0 transition-all duration-200',
              'bg-[rgba(15,23,42,0.6)] border border-[rgba(56,189,248,0.08)]',
              'hover:border-[rgba(6,182,212,0.25)] hover:shadow-[0_0_16px_rgba(6,182,212,0.08)]'
            )}
          >
            {tokenOut ? (
              <>
                <TokenIcon address={tokenOut.address} symbol={tokenOut.symbol} logoURI={tokenOut.logoURI} size="sm" />
                <span className="font-bold text-[var(--color-text)] text-sm">{tokenOut.symbol}</span>
              </>
            ) : (
              <span className="font-semibold text-[var(--color-primary)] text-sm">{t('swap.selectToken')}</span>
            )}
          </motion.button>
        </div>
      </div>

      <div className={cn(
        'input-sunken p-4 transition-all duration-300'
      )}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
            {t('swap.targetPrice')}
            {tokenIn && tokenOut && (
              <span className="text-[var(--color-text-muted)]/60 ml-1 normal-case">
                ({tokenOut.symbol} / {tokenIn.symbol})
              </span>
            )}
          </label>
          {marketQuote && tokenOut && (
            <button
              onClick={() => {
                const amountOutWei = (marketQuote as any).amount_out?.split('.')[0] || '0';
                if (amountOutWei !== '0') {
                  const priceStr = formatUnits(BigInt(amountOutWei), tokenOut.decimals);
                  const priceNum = parseFloat(priceStr);
                  if (priceNum > 0) setLimitPrice(formatNumber(priceNum));
                }
              }}
              className="text-[10px] font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-[rgba(6,182,212,0.08)] hover:bg-[rgba(6,182,212,0.15)] px-2 py-0.5 rounded-md transition-all duration-200 cursor-pointer"
            >
              {t('swap.marketPrice')}
            </button>
          )}
        </div>
        <input
          type="text"
          inputMode="decimal"
          placeholder={t('swap.enterPrice')}
          value={limitPrice}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) {
              setLimitPrice(v);
              setPriceAutoFilled(false);
            }
          }}
          className="w-full bg-transparent text-xl font-semibold text-[var(--color-text)] font-[var(--font-mono)] tabular-nums placeholder-[var(--color-text-muted)] outline-none"
        />
      </div>

      <div className="input-sunken p-4">
        <label className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1.5 mb-3 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          {t('swap.orderExpiry')}
        </label>
        <div className="flex gap-2">
          {DEADLINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDeadlineMinutes(opt.value)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                deadlineMinutes === opt.value
                  ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-[0_2px_12px_rgba(6,182,212,0.3)]'
                  : 'bg-[rgba(15,23,42,0.6)] border border-[rgba(56,189,248,0.06)] text-[var(--color-text-secondary)] hover:border-[rgba(6,182,212,0.2)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {txError && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3.5 rounded-xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20"
        >
          <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--color-danger)] break-all overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{txError}</p>
        </motion.div>
      )}

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-[var(--color-success)]/8 border border-[var(--color-success)]/20 text-center shadow-[0_0_20px_rgba(52,211,153,0.06)]"
        >
          <p className="text-sm font-semibold text-[var(--color-success)]">{t('swap.orderPlaced')}</p>
        </motion.div>
      )}

      <motion.button
        whileHover={isValid && !isProcessing ? { scale: 1.01, y: -2 } : {}}
        whileTap={isValid && !isProcessing ? { scale: 0.99 } : {}}
        onClick={handlePlaceOrder}
        disabled={!isValid || isProcessing}
        className={cn(
          'btn-primary w-full h-14 rounded-2xl',
          (!isValid || isProcessing) && 'opacity-50 !cursor-not-allowed !shadow-none !transform-none [&]:bg-gradient-to-r [&]:from-[#334155] [&]:to-[#475569]'
        )}
      >
        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
        {buttonText}
      </motion.button>
    </div>
  );
}
