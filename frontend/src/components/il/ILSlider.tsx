'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ILSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const SNAP_POINTS = [-50, -25, 0, 25, 50, 100, 200];
const SNAP_THRESHOLD = 5;

function formatLabel(val: number): string {
  if (val > 0) return `+${val}%`;
  return `${val}%`;
}

export function ILSlider({
  value,
  onChange,
  min = -50,
  max = 200,
  className,
}: ILSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const showTooltip = isDragging || isHovering;

  const normalizedPosition = useMemo(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const snapToNearest = useCallback(
    (rawValue: number): number => {
      for (const snap of SNAP_POINTS) {
        if (snap >= min && snap <= max && Math.abs(rawValue - snap) <= SNAP_THRESHOLD) {
          return snap;
        }
      }
      return Math.round(rawValue);
    },
    [min, max],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value);
      const snapped = snapToNearest(raw);
      onChange(snapped);
    },
    [onChange, snapToNearest],
  );

  const handleSnapClick = useCallback(
    (snapValue: number) => {
      onChange(snapValue);
    },
    [onChange],
  );

  const trackGradient = useMemo(() => {
    const zeroPos = ((0 - min) / (max - min)) * 100;
    return `linear-gradient(to right,
      var(--accent-danger) 0%,
      var(--accent-warning) ${zeroPos * 0.5}%,
      var(--accent-tertiary) ${zeroPos}%,
      var(--accent-warning) ${zeroPos + (100 - zeroPos) * 0.5}%,
      var(--accent-danger) 100%
    )`;
  }, [min, max]);

  const thumbColor = useMemo(() => {
    const absVal = Math.abs(value);
    if (absVal <= 10) return 'var(--accent-tertiary)';
    if (absVal <= 50) return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  }, [value]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative pt-8 pb-2">
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-1 pointer-events-none z-10"
              style={{
                left: `${normalizedPosition}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
                style={{
                  background: 'var(--bg-surface-2)',
                  color: thumbColor,
                  border: '1px solid var(--border-subtle)',
                  boxShadow: `0 0 12px ${thumbColor}40`,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatLabel(value)}
              </div>
              <div
                className="w-2 h-2 rotate-45 mx-auto -mt-1"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={trackRef}
          className="relative h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: trackGradient,
              opacity: 0.6,
            }}
          />

          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: trackGradient,
              opacity: 0.9,
              clipPath: `inset(0 ${100 - normalizedPosition}% 0 0)`,
            }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={handleInputChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setIsDragging(false);
          }}
          className="il-slider-input absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ top: '32px', height: '8px' }}
        />

        <div
          className="absolute top-[32px] w-5 h-5 rounded-full -translate-x-1/2 -translate-y-[6px] pointer-events-none transition-transform duration-100"
          style={{
            left: `${normalizedPosition}%`,
            background: thumbColor,
            boxShadow: `0 0 16px ${thumbColor}80, 0 0 6px ${thumbColor}60, inset 0 1px 2px rgba(255,255,255,0.3)`,
            transform: `translateX(-50%) translateY(-6px) scale(${isDragging ? 1.2 : 1})`,
          }}
        />
      </div>

      <div className="relative h-6">
        {SNAP_POINTS.filter((s) => s >= min && s <= max).map((snap) => {
          const pos = ((snap - min) / (max - min)) * 100;
          const isActive = value === snap;

          return (
            <button
              key={snap}
              onClick={() => handleSnapClick(snap)}
              className={cn(
                'absolute -translate-x-1/2 text-[10px] font-medium transition-colors duration-150',
                isActive
                  ? 'text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
              style={{
                left: `${pos}%`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {formatLabel(snap)}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .il-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
        }
        .il-slider-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          border: none;
        }
        .il-slider-input::-webkit-slider-runnable-track {
          height: 8px;
          cursor: pointer;
        }
        .il-slider-input::-moz-range-track {
          height: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
