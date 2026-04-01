'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Settings, Sparkles } from 'lucide-react';
import { parseUnits } from 'viem';
import { useAccount, useConnect } from 'wagmi';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useSwapStore } from '@/store/swapStore';
import { useSwap } from '@/hooks/useSwap';
import { useTokens } from '@/hooks/useTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApprove } from '@/hooks/useApprove';
import { usePrices } from '@/hooks/usePrices';
import { useTokenStore } from '@/store/tokenStore';
import { useChain } from '@/hooks/useChain';
import { NATIVE_ETH } from '@/config/tokens';
import { formatNumber } from '@/lib/formatters';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TokenInput } from './TokenInput';
import { TokenSelector } from './TokenSelector';
import { SwapDetails } from './SwapDetails';
import { SwapButton } from './SwapButton';
import { SwapConfirm } from './SwapConfirm';
import { SwapSuccess } from './SwapSuccess';
import { SlippageSettings } from './SlippageSettings';
import { SwapRoute } from './SwapRoute';
import { PriceImpactWarning } from './PriceImpactWarning';
import { LimitOrderForm } from './LimitOrderForm';
import { MyOrders } from './MyOrders';
import { SafetyBanner } from '@/components/safety/SafetyBanner';
import { EntryBadge } from '@/components/entry/EntryBadge';

export function SwapCard() {
  const { address: account, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { contracts } = useChain();

  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    mode,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    setMode,
    reverseTokens,
  } = useSwapStore();

  const { getToken } = useTokens();
  const { addTransaction, updateTransaction } = useTokenStore();

  const [selectorTarget, setSelectorTarget] = useState<'in' | 'out' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState('');
  const [reverseRotation, setReverseRotation] = useState(0);

  const tokenInInfo = useMemo(() => (tokenIn ? getToken(tokenIn) ?? null : null), [tokenIn, getToken]);
  const tokenOutInfo = useMemo(() => (tokenOut ? getToken(tokenOut) ?? null : null), [tokenOut, getToken]);

  const { balance: balanceInRaw, formatted: balanceIn } = useTokenBalance({
    tokenAddress: tokenIn || undefined,
    decimals: tokenInInfo?.decimals,
    watch: true,
  });

  const { balance: balanceOutRaw, formatted: balanceOut } = useTokenBalance({
    tokenAddress: tokenOut || undefined,
    decimals: tokenOutInfo?.decimals,
    watch: true,
  });

  const tokenAddresses = useMemo(
    () => [tokenIn, tokenOut].filter(Boolean) as string[],
    [tokenIn, tokenOut]
  );
  const { getUsdValue } = usePrices(tokenAddresses);

  const amountInWei = useMemo(() => {
    if (!amountIn || !tokenInInfo) return 0n;
    try {
      return parseUnits(amountIn, tokenInInfo.decimals);
    } catch {
      return 0n;
    }
  }, [amountIn, tokenInInfo]);

  const isNativeIn =
    tokenIn === NATIVE_ETH.address || tokenIn === '0x0000000000000000000000000000000000000000';

  const {
    quote,
    isQuoteLoading,
    execute: executeSwap,
    hash: swapHash,
    isLoading: isSwapping,
    isSuccess: isSwapSuccess,
    priceImpact,
    amountOut: quotedAmountOut,
    route,
  } = useSwap({
    tokenIn: tokenIn || undefined,
    tokenOut: tokenOut || undefined,
    amountIn: amountIn || undefined,
    tokenInDecimals: tokenInInfo?.decimals,
    tokenOutDecimals: tokenOutInfo?.decimals,
  });

  const { needsApproval, approve, isApproving } = useApprove({
    tokenAddress: isNativeIn ? undefined : (tokenIn || undefined),
    spenderAddress: contracts.router,
    amount: amountInWei,
  });

  useEffect(() => {
    if (quotedAmountOut && quotedAmountOut !== '0') {
      setAmountOut(quotedAmountOut);
    }
  }, [quotedAmountOut, setAmountOut]);

  const { data: routeData } = useQuery({
    queryKey: ['swapRoute', tokenIn, tokenOut],
    queryFn: () => api.getSwapRoute(tokenIn!, tokenOut!),
    enabled: !!tokenIn && !!tokenOut && tokenIn !== tokenOut,
    staleTime: 60_000,
  });

  const displayRoute = route.length > 0 ? route : (routeData?.routes?.[0]?.path ?? []);

  const { data: insightData } = useQuery({
    queryKey: ['swapInsight', tokenIn, tokenOut],
    queryFn: () => api.swapInsight(tokenIn!, tokenOut!),
    enabled: !!tokenIn && !!tokenOut && tokenIn !== tokenOut,
    staleTime: 60_000,
  });

  const aiInsight = insightData?.insight?.summary ?? null;

  useEffect(() => {
    if (isSwapSuccess && swapHash) {
      setShowConfirm(false);
      setSuccessTxHash(swapHash);
      setShowSuccess(true);
      addTransaction({
        type: 'swap',
        description: `${amountIn} ${tokenInInfo?.symbol} -> ${amountOut} ${tokenOutInfo?.symbol}`,
        txHash: swapHash,
        status: 'success',
      });
    }
  }, [isSwapSuccess, swapHash]);

  const handleConnect = useCallback(() => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  }, [connect, connectors]);

  const handleReverse = useCallback(() => {
    reverseTokens();
    setReverseRotation((prev) => prev + 180);
  }, [reverseTokens]);

  const handleApprove = useCallback(async () => {
    try {
      await approve();
    } catch {}
  }, [approve]);

  const handleSwap = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmSwap = useCallback(async () => {
    try {
      const txHash = await executeSwap();
      if (txHash) {
        addTransaction({
          type: 'swap',
          description: `${amountIn} ${tokenInInfo?.symbol} -> ${amountOut} ${tokenOutInfo?.symbol}`,
          txHash,
          status: 'pending',
        });
      }
    } catch {}
  }, [executeSwap, addTransaction, amountIn, amountOut, tokenInInfo, tokenOutInfo]);

  const handleTokenSelect = useCallback(
    (token: { address: string }) => {
      if (selectorTarget === 'in') {
        if (token.address.toLowerCase() === tokenOut?.toLowerCase()) {
          reverseTokens();
        } else {
          setTokenIn(token.address);
        }
      } else {
        if (token.address.toLowerCase() === tokenIn?.toLowerCase()) {
          reverseTokens();
        } else {
          setTokenOut(token.address);
        }
      }
      setSelectorTarget(null);
    },
    [selectorTarget, tokenIn, tokenOut, setTokenIn, setTokenOut, reverseTokens]
  );

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setAmountIn('');
    setAmountOut('');
  }, [setAmountIn, setAmountOut]);

  const usdIn = useMemo(() => {
    if (!tokenIn || !amountIn) return undefined;
    const val = getUsdValue(tokenIn, parseFloat(amountIn));
    return val > 0 ? formatNumber(val) : undefined;
  }, [tokenIn, amountIn, getUsdValue]);

  const usdOut = useMemo(() => {
    if (!tokenOut || !amountOut) return undefined;
    const val = getUsdValue(tokenOut, parseFloat(amountOut));
    return val > 0 ? formatNumber(val) : undefined;
  }, [tokenOut, amountOut, getUsdValue]);

  const hasLiquidity = useMemo(() => {
    if (!quote) return true;
    return parseFloat(quotedAmountOut) > 0;
  }, [quote, quotedAmountOut]);

  return (
    <div className="w-full">
      <div className="card-glow">
        <div className="absolute inset-0 rounded-[var(--radius-card)] bg-gradient-to-br from-[rgba(6,182,212,0.02)] via-transparent to-[rgba(139,92,246,0.02)] pointer-events-none z-0" />

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(6,10,19,0.6)] border border-[rgba(255,255,255,0.04)]">
              <button
                onClick={() => setMode('market')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300',
                  mode === 'market'
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-[0_2px_12px_rgba(6,182,212,0.3)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {t('swap.market')}
              </button>
              <button
                onClick={() => setMode('limit')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300',
                  mode === 'limit'
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-[0_2px_12px_rgba(6,182,212,0.3)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {t('swap.limit')}
              </button>
            </div>
            <EntryBadge tokenAddress={tokenOut || undefined} />

            <button
              onClick={() => setShowSettings(true)}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
                'hover:bg-[rgba(6,182,212,0.06)] border border-transparent hover:border-[rgba(6,182,212,0.1)]'
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'market' && (
              <motion.div
                key="market"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <TokenInput
                  label={t('swap.youPay')}
                  amount={amountIn}
                  onAmountChange={setAmountIn}
                  token={tokenInInfo}
                  onTokenSelect={() => setSelectorTarget('in')}
                  balance={balanceIn}
                  balanceRaw={balanceInRaw}
                  usdValue={usdIn}
                />

                <div className="relative flex justify-center -my-2 z-10">
                  <motion.button
                    animate={{ rotate: reverseRotation }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={handleReverse}
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300',
                      'bg-[rgba(6,10,19,0.8)] border border-[rgba(6,182,212,0.1)]',
                      'hover:border-[rgba(6,182,212,0.3)] hover:shadow-[0_0_24px_rgba(6,182,212,0.12)]',
                      'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
                      'shadow-lg'
                    )}
                  >
                    <ArrowUpDown className="w-5 h-5" />
                  </motion.button>
                </div>

                <TokenInput
                  label={t('swap.youReceive')}
                  amount={amountOut}
                  onAmountChange={() => {}}
                  token={tokenOutInfo}
                  onTokenSelect={() => setSelectorTarget('out')}
                  balance={balanceOut}
                  balanceRaw={balanceOutRaw}
                  usdValue={usdOut}
                  readOnly
                  isLoading={isQuoteLoading && !!amountIn && parseFloat(amountIn) > 0}
                />

                <PriceImpactWarning priceImpact={priceImpact} />

                <SwapDetails
                  tokenIn={tokenInInfo}
                  tokenOut={tokenOutInfo}
                  amountIn={amountIn}
                  amountOut={amountOut}
                  priceImpact={priceImpact}
                  route={displayRoute}
                  getToken={getToken}
                  isLoading={isQuoteLoading}
                  aiInsight={aiInsight}
                />

                <SafetyBanner tokenAddress={tokenOut || undefined} />

                {displayRoute.length > 2 && (
                  <SwapRoute route={displayRoute} getToken={getToken} />
                )}

                {aiInsight && (!tokenInInfo || !tokenOutInfo || !parseFloat(amountIn) || !parseFloat(amountOut)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-start gap-2.5 px-3.5 py-3 rounded-xl relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(59, 130, 246, 0.04))',
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-accent-violet)]" />
                    <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                      {aiInsight}
                    </p>
                  </motion.div>
                )}

                <div className="mt-4">
                  <SwapButton
                    isConnected={isConnected}
                    onConnect={handleConnect}
                    tokenIn={tokenIn}
                    tokenOut={tokenOut}
                    tokenInSymbol={tokenInInfo?.symbol ?? ''}
                    amountIn={amountIn}
                    balanceRaw={balanceInRaw}
                    amountInWei={amountInWei}
                    needsApproval={needsApproval && !isNativeIn}
                    isApproving={isApproving}
                    onApprove={handleApprove}
                    onSwap={handleSwap}
                    isSwapping={isSwapping}
                    isQuoteLoading={isQuoteLoading}
                    priceImpact={priceImpact}
                    hasLiquidity={hasLiquidity}
                  />
                </div>
              </motion.div>
            )}

            {mode === 'limit' && (
              <motion.div
                key="limit"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <LimitOrderForm
                  tokenIn={tokenInInfo}
                  tokenOut={tokenOutInfo}
                  onSelectTokenIn={() => setSelectorTarget('in')}
                  onSelectTokenOut={() => setSelectorTarget('out')}
                />
                <div className="gradient-divider" />
                <MyOrders />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TokenSelector
        isOpen={selectorTarget !== null}
        onClose={() => setSelectorTarget(null)}
        onSelect={handleTokenSelect}
        selectedToken={selectorTarget === 'in' ? tokenIn || undefined : tokenOut || undefined}
        otherToken={selectorTarget === 'in' ? tokenOut || undefined : tokenIn || undefined}
      />

      <SlippageSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <SwapConfirm
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSwap}
        tokenIn={tokenInInfo}
        tokenOut={tokenOutInfo}
        amountIn={amountIn}
        amountOut={amountOut}
        priceImpact={priceImpact}
        route={displayRoute}
        getToken={getToken}
        isSwapping={isSwapping}
      />

      <SwapSuccess
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        txHash={successTxHash}
        tokenIn={tokenInInfo}
        tokenOut={tokenOutInfo}
        amountIn={amountIn}
        amountOut={amountOut}
      />
    </div>
  );
}
