'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface MiniSparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniSparkline({
  data,
  width = 60,
  height = 24,
  color,
  className,
}: MiniSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasData = !!data && data.length >= 2;

  const isPositive = hasData ? data![data!.length - 1] >= data![0] : true;
  const lineColor = color || (isPositive ? '#10B981' : '#EF4444');

  const chartData = useMemo(() => {
    if (!hasData) return [];
    return data!.map((value, index) => ({
      time: index as any,
      value,
    }));
  }, [data, hasData]);

  useEffect(() => {
    if (!containerRef.current || !hasData || chartData.length < 2) return;
    if (containerRef.current.clientWidth <= 0) return;

    const origError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'object' && args[0]?.message?.includes?.('Expected length')) return;
      origError.apply(console, args);
    };

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      width,
      height,
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addLineSeries({
      color: lineColor,
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    series.setData(chartData as any);
    chart.timeScale().fitContent();

    return () => {
      console.error = origError;
      chart.remove();
    };
  }, [chartData, width, height, lineColor, hasData]);

  if (!hasData) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden', className)}
      style={{ width, height }}
    />
  );
}
