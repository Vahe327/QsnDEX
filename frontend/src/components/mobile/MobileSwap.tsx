'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Settings, Sparkles, BarChart3 } from 'lucide-react';
import { parseUnits } from 'viem';
import { useAccount, useConnect } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { useSwapStore } from '@/store/swapStore';
import { useSwap } from '@/hooks/useSwap';
import { useTokens } from '@/hooks/useTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApprove } from '@/hooks/useApprove';
import { usePrices } from '@/hooks/usePrices';
import { useTokenStore } from '@/store/tokenStore';
import { useChain } from '@/hooks/useChain';
import { NATIVE_ETH } from '@/config/tokens';
import { api } from '@/lib/api';
import { TokenInput } from '@/components/swap/TokenInput';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { SwapDetails } from '@/components/swap/SwapDetails';
import { SwapButton } from '@/components/swap/SwapButton';
import { SwapConfirm } from '@/components/swap/SwapConfirm';
import { SwapSuccess } from '@/components/swap/SwapSuccess';
import { SlippageSettings } from '@/components/swap/SlippageSettings';
import { SwapRoute } from '@/components/swap/SwapRoute';
import { PriceImpactWarning } from '@/components/swap/PriceImpactWarning';
import { LimitOrderForm } from '@/components/swap/LimitOrderForm';
import { MyOrders } from '@/components/swap/MyOrders';
import { SafetyBanner } from '@/components/safety/SafetyBanner';
import { EntryBadge } from '@/components/entry/EntryBadge';
import { PriceChart } from '@/components/charts/PriceChart';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { BridgeBanner } from '@/components/common/BridgeBanner';

type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M';

const TIMEFRAME_TO_PERIOD: Record<Timeframe, string> = {
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '7d',
  '1M': '30d',
};

export function MobileSwap() {
  const { address: account, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { contracts, chainId } = useChain();

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
  const { addTransaction } = useTokenStore();

  const [selectorTarget, setSelectorTarget] = useState<'in' | 'out' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState('');
  const [reverseRotation, setReverseRotation] = useState(0);
  const [showChart, setShowChart] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

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

  const period = TIMEFRAME_TO_PERIOD[timeframe];

  const resolveAddr = (addr: string | undefined) => {
    if (!addr) return undefined;
    if (addr.toLowerCase() === NATIVE_ETH.address.toLowerCase()) return contracts.weth?.toLowerCase();
    return addr.toLowerCase();
  };
  const chartTokenIn = resolveAddr(tokenIn);
  const chartTokenOut = resolveAddr(tokenOut);

  const { data: mobilePoolsData } = useQuery({
    queryKey: ['swapPairPool', chainId, chartTokenIn, chartTokenOut],
    queryFn: () => api.getPools({ limit: 50, chainId }),
    enabled: !!chartTokenIn && !!chartTokenOut && showChart,
    staleTime: 60_000,
  });

  const mobileMatchedPool = mobilePoolsData?.pools?.find((p: any) => {
    const t0 = p.token0?.toLowerCase();
    const t1 = p.token1?.toLowerCase();
    return (t0 === chartTokenIn && t1 === chartTokenOut) || (t0 === chartTokenOut && t1 === chartTokenIn);
  });
  const mobilePoolAddress = mobileMatchedPool?.address;
  const mobileShouldInvert = mobileMatchedPool && chartTokenIn === mobileMatchedPool.token1?.toLowerCase();

  const { data: chartResponse, isLoading: chartLoading } = useQuery({
    queryKey: ['poolChart', chainId, mobilePoolAddress, period],
    queryFn: async () => {
      if (!mobilePoolAddress) return null;
      try {
        return await api.getPoolChart(mobilePoolAddress, period, chainId);
      } catch {
        return null;
      }
    },
    enabled: !!mobilePoolAddress && showChart,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const chartData = chartResponse?.chart?.map((point: any) => {
    const raw = Number(point.price ?? point.value ?? point.close ?? 0);
    const value = mobileShouldInvert && raw > 0 ? 1 / raw : raw;
    return {
      time: Math.floor(new Date(point.timestamp || point.time).getTime() / 1000),
      value,
    };
  }).filter((p: any) => p.value > 0 && !isNaN(p.time)) ?? undefined;

  const mobileOhlcData = chartData && chartData.length > 0 ? chartData.map((p) => ({
    time: p.time,
    open: p.value,
    high: p.value,
    low: p.value,
    close: p.value,
  })) : undefined;

  const hasChartData = (chartData && chartData.length > 0) || (mobileOhlcData && mobileOhlcData.length > 0);

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
    if (connector) connect({ connector });
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
    <div className="px-3 pt-3 pb-4">
      <NetworkSwitcher />
      <BridgeBanner />

      <button
        onClick={() => setShowChart(!showChart)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-sm font-semibold transition-all duration-200 min-h-[44px]"
        style={{
          background: showChart ? 'var(--gradient-glow)' : 'var(--bg-surface)',
          border: `1px solid ${showChart ? 'var(--border-active)' : 'var(--border-subtle)'}`,
          color: showChart ? 'var(--accent-primary)' : 'var(--text-secondary)',
        }}
      >
        <BarChart3 className="w-4 h-4" />
        {showChart ? t('swap.hideChart') : t('swap.showChart')}
      </button>

      <AnimatePresence>
        {showChart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-3"
          >
            <div
              className="rounded-2xl overflow-hidden h-[320px]"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <PriceChart
                tokenIn={tokenIn}
                tokenOut={tokenOut}
                data={hasChartData ? chartData : undefined}
                ohlcData={mobileOhlcData}
                loading={chartLoading}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={() => setMode('market')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 min-h-[36px]',
                  mode === 'market'
                    ? 'text-white'
                    : 'text-[var(--text-tertiary)]'
                )}
                style={
                  mode === 'market'
                    ? { background: 'var(--gradient-primary)', boxShadow: 'var(--glow-gold)' }
                    : undefined
                }
              >
                {t('swap.market')}
              </button>
              <button
                onClick={() => setMode('limit')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 min-h-[36px]',
                  mode === 'limit'
                    ? 'text-white'
                    : 'text-[var(--text-tertiary)]'
                )}
                style={
                  mode === 'limit'
                    ? { background: 'var(--gradient-primary)', boxShadow: 'var(--glow-gold)' }
                    : undefined
                }
              >
                {t('swap.limit')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <EntryBadge tokenAddress={tokenOut || undefined} />
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                style={{
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-2)',
                }}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
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
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: 'var(--bg-deep)',
                      border: '1px solid var(--border-glow)',
                      color: 'var(--text-secondary)',
                    }}
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
                    style={{ background: 'var(--gradient-glow)' }}
                  >
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
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
                <div style={{ height: 1, background: 'var(--border-subtle)' }} />
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
