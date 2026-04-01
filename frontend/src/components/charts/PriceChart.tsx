'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineStyle } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { TrendingUp, CandlestickChart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useTokens } from '@/hooks/useTokens';

function formatChartPrice(n: number): string {
  if (n === 0 || isNaN(n)) return '0';
  if (n >= 1_000_000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1_000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  if (n >= 0.0000001) return n.toFixed(10);
  return n.toFixed(14);
}

type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M';
type ChartType = 'line' | 'candlestick';

interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LineData {
  time: number;
  value: number;
}

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M'];

interface PriceChartProps {
  tokenIn?: string;
  tokenOut?: string;
  data?: LineData[];
  ohlcData?: OHLCData[];
  onTimeframeChange?: (tf: Timeframe) => void;
  timeframe?: Timeframe;
  className?: string;
  loading?: boolean;
}

function invertLineData(d: LineData[]): LineData[] {
  return d.map((p) => ({ time: p.time, value: p.value > 0 ? 1 / p.value : 0 }));
}

function invertOhlcData(d: OHLCData[]): OHLCData[] {
  return d.map((p) => ({
    time: p.time,
    open: p.open > 0 ? 1 / p.open : 0,
    high: p.low > 0 ? 1 / p.low : 0,
    low: p.high > 0 ? 1 / p.high : 0,
    close: p.close > 0 ? 1 / p.close : 0,
  }));
}

export function PriceChart({
  tokenIn,
  tokenOut,
  data,
  ohlcData,
  onTimeframeChange,
  timeframe = '1D',
  className,
  loading = false,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [chartType, setChartType] = useState<ChartType>('line');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(timeframe);
  const [currentPrice, setCurrentPrice] = useState<string>('--');
  const [priceChange, setPriceChange] = useState<number>(0);
  const [inverted, setInverted] = useState(false);

  const { getToken } = useTokens();
  const tokenInInfo = tokenIn ? getToken(tokenIn) : null;
  const tokenOutInfo = tokenOut ? getToken(tokenOut) : null;
  const pairLabel = tokenInInfo && tokenOutInfo
    ? inverted
      ? `${tokenOutInfo.symbol} / ${tokenInInfo.symbol}`
      : `${tokenInInfo.symbol} / ${tokenOutInfo.symbol}`
    : '';

  const displayData = useMemo(() => {
    if (!data) return undefined;
    return inverted ? invertLineData(data) : data;
  }, [data, inverted]);

  const displayOhlc = useMemo(() => {
    if (!ohlcData) return undefined;
    return inverted ? invertOhlcData(ohlcData) : ohlcData;
  }, [ohlcData, inverted]);

  const hasOhlc = displayOhlc && displayOhlc.length > 0;
  const hasLine = displayData && displayData.length > 0;
  const hasData = hasOhlc || hasLine;

  const handleTimeframeChange = useCallback(
    (tf: Timeframe) => {
      setActiveTimeframe(tf);
      onTimeframeChange?.(tf);
    },
    [onTimeframeChange]
  );

  useEffect(() => {
    if (!chartContainerRef.current || !hasData) return;

    const container = chartContainerRef.current;
    if (container.clientWidth <= 0) return;

    const origError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'object' && args[0]?.message?.includes?.('Expected length')) return;
      origError.apply(console, args);
    };

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#475569',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(240, 180, 41, 0.03)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(240, 180, 41, 0.03)', style: LineStyle.Dotted },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      crosshair: {
        vertLine: { color: 'rgba(240, 180, 41, 0.2)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(240, 180, 41, 0.2)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(240, 180, 41, 0.06)',
        scaleMargins: { top: 0.35, bottom: 0.05 },
      },
      localization: {
        priceFormatter: (price: number) => formatChartPrice(price),
      },
      timeScale: {
        borderColor: 'rgba(240, 180, 41, 0.06)',
        timeVisible: true,
        secondsVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(container);

    if (chartType === 'candlestick' && hasOhlc) {
      const series = chart.addCandlestickSeries({
        upColor: '#34D399',
        downColor: '#F87171',
        borderUpColor: '#34D399',
        borderDownColor: '#F87171',
        wickUpColor: '#34D399',
        wickDownColor: '#F87171',
        priceFormat: { type: 'custom', formatter: (price: number) => formatChartPrice(price) },
      });
      series.setData(displayOhlc as any);

      const last = displayOhlc![displayOhlc!.length - 1];
      const first = displayOhlc![0];
      if (last && first) {
        setCurrentPrice(formatChartPrice(last.close));
        const change = first.open !== 0 ? ((last.close - first.open) / first.open) * 100 : 0;
        setPriceChange(isNaN(change) ? 0 : change);
      }
    } else if (hasLine) {
      const lineData = displayData!;

      chart.addAreaSeries({
        topColor: 'rgba(240, 180, 41, 0.15)',
        bottomColor: 'rgba(240, 180, 41, 0.01)',
        lineColor: 'transparent',
        lineWidth: 1,
        priceFormat: { type: 'custom', formatter: (price: number) => formatChartPrice(price) },
      }).setData(lineData as any);

      chart.addLineSeries({
        color: '#F0B429',
        lineWidth: 2,
        crosshairMarkerBackgroundColor: '#F0B429',
        crosshairMarkerBorderColor: '#060A13',
        crosshairMarkerRadius: 5,
        lastValueVisible: false,
        priceLineVisible: false,
        priceFormat: { type: 'custom', formatter: (price: number) => formatChartPrice(price) },
      }).setData(lineData as any);

      const last = lineData[lineData.length - 1];
      const first = lineData[0];
      if (last && first) {
        setCurrentPrice(formatChartPrice(last.value));
        const change = first.value !== 0 ? ((last.value - first.value) / first.value) * 100 : 0;
        setPriceChange(isNaN(change) ? 0 : change);
      }
    }

    chart.timeScale().fitContent();

    return () => {
      console.error = origError;
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
      areaSeriesRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [hasData, hasLine, hasOhlc, displayData, displayOhlc, chartType, inverted]);

  return (
    <div className={cn('relative h-full', className)}>
      <div className="absolute inset-0 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(6,10,19,0.4)] backdrop-blur-sm rounded-b-2xl">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        )}

        {!loading && !hasData && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'var(--bg-surface-alpha)',
                border: '1px solid rgba(240, 180, 41, 0.1)',
                boxShadow: '0 0 20px rgba(240, 180, 41, 0.05)',
              }}
            >
              <BarChart3 className="w-7 h-7 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {t('swap.noChartData')}
              </p>
            </div>
          </div>
        )}

        {hasData && <div ref={chartContainerRef} className="w-full h-full" />}
      </div>

      <div className="absolute inset-x-0 top-0" style={{ zIndex: 10 }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-[var(--color-text)] mb-1">{pairLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-[var(--font-mono)] tabular-nums gradient-text-price">
                  {currentPrice}
                </span>
                {hasData && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-bold font-[var(--font-mono)]',
                      priceChange >= 0
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                    )}
                  >
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(6,10,19,0.85)] border border-[rgba(56,189,248,0.1)] mr-16">
              <button
                onClick={() => setChartType('line')}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer',
                  chartType === 'line'
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(255,255,255,0.05)]'
                )}
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer',
                  chartType === 'candlestick'
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(255,255,255,0.05)]'
                )}
              >
                <CandlestickChart className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer',
                  activeTimeframe === tf
                    ? 'bg-gradient-to-r from-[rgba(6,182,212,0.15)] to-[rgba(59,130,246,0.15)] text-[var(--color-primary)] shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.02)]'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
