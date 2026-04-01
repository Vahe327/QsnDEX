'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface SafetyScoreProps {
  score: number;
  riskLevel: string;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#10B981';
  if (score >= 5) return '#D97706';
  return '#EF4444';
}

function getScoreGlow(score: number): string {
  if (score >= 8) return '0 0 24px rgba(16,185,129,0.35)';
  if (score >= 5) return '0 0 24px rgba(217,119,6,0.35)';
  return '0 0 24px rgba(239,68,68,0.35)';
}

function getRiskLevelKey(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'safety.risk_low';
    case 'medium':
      return 'safety.risk_medium';
    case 'high':
      return 'safety.risk_high';
    case 'critical':
      return 'safety.risk_critical';
    default:
      return 'safety.risk_unknown';
  }
}

export function SafetyScore({ score, riskLevel, size = 120 }: SafetyScoreProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const color = useMemo(() => getScoreColor(score), [score]);
  const glow = useMemo(() => getScoreGlow(score), [score]);
  const normalizedScore = Math.max(0, Math.min(10, score));
  const strokeDashoffset = circumference - (normalizedScore / 10) * circumference;

  const fontSize = size * 0.28;
  const labelFontSize = size * 0.11;
  const riskFontSize = size * 0.1;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          style={{ filter: `drop-shadow(${glow})` }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
            opacity={0.3}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold leading-none"
            style={{
              fontSize,
              color,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {normalizedScore.toFixed(1)}
          </motion.span>
          <span
            className="font-medium leading-none mt-0.5"
            style={{
              fontSize: labelFontSize,
              color: 'var(--text-secondary)',
            }}
          >
            / 10
          </span>
        </div>
      </div>
      <motion.span
        className={cn(
          'font-semibold uppercase tracking-wider rounded-full px-3 py-1',
          'backdrop-blur-sm border'
        )}
        style={{
          fontSize: riskFontSize,
          color,
          backgroundColor: `${color}15`,
          borderColor: `${color}30`,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        {t(getRiskLevelKey(riskLevel))}
      </motion.span>
    </div>
  );
}
