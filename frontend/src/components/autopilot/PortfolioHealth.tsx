'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface PortfolioHealthProps {
  score: number;
  size?: number;
  className?: string;
}

function getHealthStatus(score: number): {
  labelKey: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
} {
  if (score >= 80) {
    return {
      labelKey: 'autopilot.healthy',
      color: '#10B981',
      gradientStart: '#34D399',
      gradientEnd: '#059669',
    };
  }
  if (score >= 50) {
    return {
      labelKey: 'autopilot.needs_attention',
      color: '#F59E0B',
      gradientStart: '#FBBF24',
      gradientEnd: '#D97706',
    };
  }
  return {
    labelKey: 'autopilot.at_risk',
    color: '#EF4444',
    gradientStart: '#F87171',
    gradientEnd: '#DC2626',
  };
}

export function PortfolioHealth({ score, size = 120, className }: PortfolioHealthProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const { labelKey, color, gradientStart, gradientEnd } = useMemo(() => getHealthStatus(clampedScore), [clampedScore]);

  const strokeWidth = size * 0.1;
  const innerStroke = strokeWidth * 0.4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const center = size / 2;

  const scoreFontSize = size * 0.26;
  const labelFontSize = size * 0.105;
  const gradId = `gauge-grad-${clampedScore}`;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className="relative"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          boxShadow: `
            0 6px 24px rgba(0, 0, 0, 0.6),
            0 2px 6px rgba(0, 0, 0, 0.4),
            inset 0 3px 6px rgba(255, 255, 255, 0.05),
            inset 0 -3px 8px rgba(0, 0, 0, 0.4),
            inset 0 0 ${size * 0.15}px rgba(0, 0, 0, 0.2)
          `,
          background: `
            radial-gradient(circle at 50% 35%, rgba(255,255,255,0.04) 0%, transparent 60%),
            linear-gradient(180deg, #12141C 0%, #0A0C12 100%)
          `,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
            <filter id="track-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="0" dy="1" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feFlood floodColor="rgba(0,0,0,0.5)" />
              <feComposite in2="SourceGraphic" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="arc-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feFlood floodColor={color} floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
            filter="url(#track-shadow)"
          />

          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            filter="url(#arc-glow)"
          />

          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={innerStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ mixBlendMode: 'overlay' }}
          />
        </svg>

        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            top: strokeWidth + 4,
            left: strokeWidth + 4,
            right: strokeWidth + 4,
            bottom: strokeWidth + 4,
            borderRadius: '50%',
            background: `
              radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 50%),
              linear-gradient(180deg, #14161E 0%, #0C0D12 100%)
            `,
            boxShadow: `
              inset 0 2px 4px rgba(255, 255, 255, 0.05),
              inset 0 -2px 6px rgba(0, 0, 0, 0.5),
              0 1px 2px rgba(0, 0, 0, 0.3)
            `,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(0,0,0,0.3)',
          }}
        >
          <motion.span
            style={{
              fontSize: scoreFontSize,
              color,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              lineHeight: 1,
              textShadow: `
                0 0 20px ${color}50,
                0 0 40px ${color}20,
                0 1px 1px rgba(0,0,0,0.7),
                0 2px 4px rgba(0,0,0,0.3)
              `,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {clampedScore}
          </motion.span>
        </div>

        <div
          className="absolute pointer-events-none"
          style={{
            top: '8%',
            left: '15%',
            width: '35%',
            height: '20%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.07) 0%, transparent 70%)',
            transform: 'rotate(-20deg)',
          }}
        />
      </div>

      <motion.span
        style={{
          fontSize: labelFontSize,
          color,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textShadow: `
            0 0 14px ${color}60,
            0 0 28px ${color}25,
            0 1px 2px rgba(0,0,0,0.6)
          `,
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        {t(labelKey)}
      </motion.span>
    </div>
  );
}
