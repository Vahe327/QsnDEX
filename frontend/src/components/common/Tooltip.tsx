'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

const positionStyles: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const motionOrigin: Record<string, { initial: Record<string, number>; animate: Record<string, number>; exit: Record<string, number> }> = {
  top: {
    initial: { opacity: 0, y: 4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 4, scale: 0.96 },
  },
  bottom: {
    initial: { opacity: 0, y: -4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4, scale: 0.96 },
  },
  left: {
    initial: { opacity: 0, x: 4, scale: 0.96 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 4, scale: 0.96 },
  },
  right: {
    initial: { opacity: 0, x: -4, scale: 0.96 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -4, scale: 0.96 },
  },
};

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  }

  function handleMouseLeave() {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  }

  const variants = motionOrigin[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute z-50 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none',
              'bg-[var(--bg-surface)]/90 backdrop-blur-xl',
              'border border-[var(--border-glow)] text-[var(--text-primary)]',
              'shadow-[var(--shadow-lg)]',
              positionStyles[position],
              className,
            )}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.15 }}
          >
            {content}
            {position === 'top' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[var(--bg-surface)]/90 border-r border-b border-[var(--border-glow)]" />
            )}
            {position === 'bottom' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[var(--bg-surface)]/90 border-l border-t border-[var(--border-glow)]" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
