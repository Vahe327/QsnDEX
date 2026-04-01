'use client';

import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, ColorType, LineStyle, CrosshairMode } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface TVLDataPoint {
  time: string | number;
  value: number;
}

interface TVLChartProps {
  data?: TVLDataPoint[];
  height?: number;
  className?: string;
  loading?: boolean;
}

export function TVLChart({ data = [], height = 300, className, loading = false }: TVLChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const validData = data.filter(d => d.time && d.value !== undefined && !isNaN(Number(d.time)) && Number(d.time) > 0);
  const hasData = validData.length >= 2;

  useEffect(() => {
    if (!chartContainerRef.current || !hasData) return;

    let rafId: number;
    let chart: IChartApi | null = null;
    let observer: ResizeObserver | null = null;

    const origError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'object' && args[0]?.message?.includes?.('Expected length')) return;
      origError.apply(console, args);
    };

    rafId = requestAnimationFrame(() => {
      const container = chartContainerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      if (w <= 0) return;

      chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#3D4A66',
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(240, 180, 41, 0.03)', style: LineStyle.Dotted },
          horzLines: { color: 'rgba(240, 180, 41, 0.03)', style: LineStyle.Dotted },
        },
        width: w,
        height,
        rightPriceScale: {
          borderColor: 'rgba(240, 180, 41, 0.08)',
          scaleMargins: { top: 0.1, bottom: 0.05 },
        },
        timeScale: {
          borderColor: 'rgba(240, 180, 41, 0.08)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: CrosshairMode.Magnet,
          vertLine: { color: 'rgba(240, 180, 41, 0.3)', width: 1, style: LineStyle.Dashed, labelVisible: false },
          horzLine: { color: 'rgba(240, 180, 41, 0.3)', width: 1, style: LineStyle.Dashed, labelVisible: false },
        },
        handleScroll: { vertTouchDrag: false },
      });

      chartRef.current = chart;

      const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(240, 180, 41, 0.25)',
        bottomColor: 'rgba(240, 180, 41, 0.01)',
        lineColor: '#F0B429',
        lineWidth: 2,
        crosshairMarkerBackgroundColor: '#F0B429',
        crosshairMarkerBorderColor: '#050810',
        crosshairMarkerRadius: 5,
        lastValueVisible: true,
        priceLineVisible: false,
      });

      areaSeries.setData(validData as any);
      chart.timeScale().fitContent();

      observer = new ResizeObserver((entries) => {
        if (chart) {
          for (const entry of entries) {
            const newW = entry.contentRect.width;
            if (newW > 0) chart.applyOptions({ width: newW });
          }
        }
      });
      observer.observe(container);
    });

    return () => {
      console.error = origError;
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      if (chart) {
        chart.remove();
        chartRef.current = null;
      }
    };
  }, [validData, height, hasData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-[20px] overflow-hidden',
        'bg-surface-alpha backdrop-blur-xl',
        'border border-[var(--border-subtle)]',
        className,
      )}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-surface)]/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
        </div>
      )}

      {!loading && !hasData && (
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ height }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--bg-surface-alpha)',
              border: '1px solid rgba(240, 180, 41, 0.1)',
              boxShadow: '0 0 20px rgba(240, 180, 41, 0.05)',
            }}
          >
            <BarChart3 className="w-6 h-6 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('swap.noChartData')}
          </p>
        </div>
      )}

      {hasData && <div ref={chartContainerRef} className="w-full" />}
    </motion.div>
  );
}
