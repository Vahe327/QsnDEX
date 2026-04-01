'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface ILChartProps {
  priceChangePct: number;
  className?: string;
}

const CHART_MIN_X = -50;
const CHART_MAX_X = 200;
const CHART_STEP = 1;

const SVG_WIDTH = 600;
const SVG_HEIGHT = 320;
const PADDING_LEFT = 56;
const PADDING_RIGHT = 24;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 44;

const PLOT_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

const Y_GRID_LINES = [0, -5, -10, -15, -20, -25];
const X_GRID_LINES = [-50, -25, 0, 25, 50, 100, 150, 200];

function calculateIL(priceChangePct: number): number {
  const r = 1 + priceChangePct / 100;
  if (r <= 0) return -100;
  const il = (2 * Math.sqrt(r)) / (1 + r) - 1;
  return il * 100;
}

function xToSvg(xVal: number): number {
  return (
    PADDING_LEFT +
    ((xVal - CHART_MIN_X) / (CHART_MAX_X - CHART_MIN_X)) * PLOT_WIDTH
  );
}

function yToSvg(yVal: number): number {
  const yMin = -25;
  const yMax = 0;
  return (
    PADDING_TOP +
    ((yMax - yVal) / (yMax - yMin)) * PLOT_HEIGHT
  );
}

export function ILChart({ priceChangePct, className }: ILChartProps) {
  const points = useMemo(() => {
    const pts: { x: number; y: number; svgX: number; svgY: number }[] = [];
    for (let x = CHART_MIN_X; x <= CHART_MAX_X; x += CHART_STEP) {
      const y = calculateIL(x);
      pts.push({
        x,
        y,
        svgX: xToSvg(x),
        svgY: yToSvg(Math.max(y, -25)),
      });
    }
    return pts;
  }, []);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    const segments = points.map((p, i) =>
      i === 0 ? `M ${p.svgX} ${p.svgY}` : `L ${p.svgX} ${p.svgY}`,
    );
    return segments.join(' ');
  }, [points]);

  const fillPath = useMemo(() => {
    if (points.length === 0) return '';
    const baseline = yToSvg(0);
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.svgX} ${baseline} L ${first.svgX} ${baseline} Z`;
  }, [points, linePath]);

  const activePoint = useMemo(() => {
    const clampedX = Math.max(CHART_MIN_X, Math.min(CHART_MAX_X, priceChangePct));
    const y = calculateIL(clampedX);
    return {
      x: clampedX,
      y,
      svgX: xToSvg(clampedX),
      svgY: yToSvg(Math.max(y, -25)),
    };
  }, [priceChangePct]);

  const formatAxisLabel = useCallback((val: number, axis: 'x' | 'y') => {
    if (axis === 'x') {
      if (val > 0) return `+${val}%`;
      return `${val}%`;
    }
    return `${val}%`;
  }, []);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {t('pools.il_curve')}
        </span>
        <span
          className="text-xs font-bold text-[var(--accent-danger)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          IL: {activePoint.y.toFixed(2)}%
        </span>
      </div>

      <div
        className="card overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="il-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-danger)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent-danger)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="il-line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent-danger)" stopOpacity="0.8" />
              <stop offset="20%" stopColor="var(--accent-warning)" stopOpacity="0.9" />
              <stop offset="40%" stopColor="var(--accent-danger)" stopOpacity="0.6" />
              <stop offset="60%" stopColor="var(--accent-danger)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent-danger)" stopOpacity="1" />
            </linearGradient>
            <filter id="il-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="il-dot-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Y_GRID_LINES.map((yVal) => {
            const svgY = yToSvg(yVal);
            return (
              <g key={`y-${yVal}`}>
                <line
                  x1={PADDING_LEFT}
                  y1={svgY}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={svgY}
                  stroke="var(--border-subtle)"
                  strokeWidth={1}
                  strokeDasharray={yVal === 0 ? 'none' : '4 4'}
                  opacity={yVal === 0 ? 0.5 : 0.2}
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={svgY + 4}
                  textAnchor="end"
                  fill="var(--text-secondary)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                >
                  {formatAxisLabel(yVal, 'y')}
                </text>
              </g>
            );
          })}

          {X_GRID_LINES.map((xVal) => {
            const svgX = xToSvg(xVal);
            return (
              <g key={`x-${xVal}`}>
                <line
                  x1={svgX}
                  y1={PADDING_TOP}
                  x2={svgX}
                  y2={SVG_HEIGHT - PADDING_BOTTOM}
                  stroke="var(--border-subtle)"
                  strokeWidth={1}
                  strokeDasharray={xVal === 0 ? 'none' : '4 4'}
                  opacity={xVal === 0 ? 0.5 : 0.2}
                />
                <text
                  x={svgX}
                  y={SVG_HEIGHT - PADDING_BOTTOM + 20}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                >
                  {formatAxisLabel(xVal, 'x')}
                </text>
              </g>
            );
          })}

          <path d={fillPath} fill="url(#il-fill-gradient)" />

          <path
            d={linePath}
            fill="none"
            stroke="url(#il-line-gradient)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#il-glow)"
          />

          <motion.line
            initial={{ x1: activePoint.svgX, y1: PADDING_TOP, x2: activePoint.svgX, y2: SVG_HEIGHT - PADDING_BOTTOM }}
            stroke="var(--accent-primary)"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.4}
            animate={{
              x1: activePoint.svgX,
              y1: PADDING_TOP,
              x2: activePoint.svgX,
              y2: SVG_HEIGHT - PADDING_BOTTOM,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          <motion.line
            initial={{ x1: PADDING_LEFT, y1: activePoint.svgY, x2: SVG_WIDTH - PADDING_RIGHT, y2: activePoint.svgY }}
            stroke="var(--accent-danger)"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.3}
            animate={{
              x1: PADDING_LEFT,
              y1: activePoint.svgY,
              x2: SVG_WIDTH - PADDING_RIGHT,
              y2: activePoint.svgY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          <motion.circle
            r={7}
            fill="var(--accent-danger)"
            opacity={0.3}
            filter="url(#il-dot-glow)"
            initial={{ cx: activePoint.svgX, cy: activePoint.svgY }}
            animate={{
              cx: activePoint.svgX,
              cy: activePoint.svgY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <motion.circle
            r={5}
            fill="var(--accent-danger)"
            stroke="var(--bg-surface)"
            strokeWidth={2}
            initial={{ cx: activePoint.svgX, cy: activePoint.svgY }}
            animate={{
              cx: activePoint.svgX,
              cy: activePoint.svgY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          <motion.g
            animate={{
              x: activePoint.svgX,
              y: activePoint.svgY - 24,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <rect
              x={-36}
              y={-12}
              width={72}
              height={20}
              rx={6}
              fill="var(--bg-surface-2)"
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
            <text
              x={0}
              y={2}
              textAnchor="middle"
              fill="var(--accent-danger)"
              fontSize={11}
              fontWeight="bold"
              fontFamily="var(--font-mono)"
            >
              {activePoint.y.toFixed(2)}%
            </text>
          </motion.g>
        </svg>
      </div>
    </div>
  );
}
