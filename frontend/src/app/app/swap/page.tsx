'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { t } from '@/i18n';
import { api } from '@/lib/api';
import { SwapCard } from '@/components/swap/SwapCard';
import { PriceChart } from '@/components/charts/PriceChart';
import { BridgeBanner } from '@/components/common/BridgeBanner';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { MobileSwap } from '@/components/mobile/MobileSwap';
import { useSwapStore } from '@/store/swapStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useChain } from '@/hooks/useChain';
import { NATIVE_ETH } from '@/config/tokens';

type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M';

const TIMEFRAME_TO_PERIOD: Record<Timeframe, string> = {
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '7d',
  '1M': '30d',
};

export default function SwapPage() {
  const isMobile = useIsMobile();
  const [showChart, setShowChart] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const { tokenIn, tokenOut } = useSwapStore();
  const { chainId, contracts } = useChain();

  const period = TIMEFRAME_TO_PERIOD[timeframe];

  const resolveToken = (addr: string | undefined) => {
    if (!addr) return undefined;
    if (addr.toLowerCase() === NATIVE_ETH.address.toLowerCase()) return contracts.weth?.toLowerCase();
    return addr.toLowerCase();
  };

  const resolvedIn = resolveToken(tokenIn);
  const resolvedOut = resolveToken(tokenOut);

  const { data: poolsData } = useQuery({
    queryKey: ['swapPairPool', chainId, resolvedIn, resolvedOut],
    queryFn: () => api.getPools({ limit: 50, chainId }),
    enabled: !!resolvedIn && !!resolvedOut,
    staleTime: 60_000,
  });

  const matchedPool = poolsData?.pools?.find((p: any) => {
    const t0 = p.token0?.toLowerCase();
    const t1 = p.token1?.toLowerCase();
    return (t0 === resolvedIn && t1 === resolvedOut) || (t0 === resolvedOut && t1 === resolvedIn);
  });
  const poolAddress = matchedPool?.address;
  const shouldInvertPrice = matchedPool && resolvedIn === matchedPool.token1?.toLowerCase();

  const { data: chartResponse, isLoading: chartLoading } = useQuery({
    queryKey: ['poolChart', chainId, poolAddress, period],
    queryFn: async () => {
      if (!poolAddress) return null;
      try {
        const result = await api.getPoolChart(poolAddress, period, chainId);
        return result;
      } catch {
        return null;
      }
    },
    enabled: !!poolAddress,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const chartData = chartResponse?.chart?.map((point: any) => {
    const raw = Number(point.price ?? point.value ?? point.close ?? 0);
    const value = shouldInvertPrice && raw > 0 ? 1 / raw : raw;
    return {
      time: Math.floor(new Date(point.timestamp || point.time).getTime() / 1000),
      value,
    };
  }).filter((p: any) => p.value > 0 && !isNaN(p.time)) ?? undefined;

  const ohlcData = chartData && chartData.length > 0 ? chartData.map((p) => ({
    time: p.time,
    open: p.value,
    high: p.value,
    low: p.value,
    close: p.value,
  })) : undefined;

  const hasChartData = (chartData && chartData.length > 0) || (ohlcData && ohlcData.length > 0);

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
  }, []);

  if (isMobile) return <MobileSwap />;

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-start pt-4 sm:pt-6 md:pt-10 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-gold absolute left-1/4 top-[10%] h-[600px] w-[600px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="ambient-orb ambient-orb-amber absolute right-1/4 top-[20%] h-[400px] w-[400px] animate-[float_12s_ease-in-out_infinite_2s]" />
        <div className="ambient-orb ambient-orb-gold absolute left-1/2 bottom-[10%] h-[500px] w-[500px] animate-[float_10s_ease-in-out_infinite_4s]" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NetworkSwitcher />
          <BridgeBanner />
        </motion.div>

        <div className="md:hidden mb-3">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4" />
            {showChart ? t('swap.hideChart') : t('swap.showChart')}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 lg:gap-5 items-stretch">
          <AnimatePresence>
            {(showChart || typeof window === 'undefined') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="md:hidden overflow-hidden"
              >
                <div className="card-glow p-0 overflow-hidden h-[350px]">
                  <PriceChart
                    tokenIn={tokenIn}
                    tokenOut={tokenOut}
                    data={hasChartData ? chartData : undefined}
                    ohlcData={ohlcData}
                    loading={chartLoading}
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:block flex-[3]"
          >
            <div className="card-glow p-0 overflow-hidden h-[560px]">
              <PriceChart
                tokenIn={tokenIn}
                tokenOut={tokenOut}
                data={hasChartData ? chartData : undefined}
                loading={chartLoading}
                timeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:flex-[2] md:max-w-[480px]"
          >
            <SwapCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
