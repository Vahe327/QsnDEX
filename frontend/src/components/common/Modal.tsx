'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const desktopVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.15 } },
};

const mobileVariants = {
  hidden: { y: 60 },
  visible: { y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { y: 60, transition: { duration: 0.15 } },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = 'md',
  showClose = true,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          <motion.div
            className={cn(
              'relative hidden sm:flex sm:flex-col w-full p-6',
              'bg-surface backdrop-blur-3xl',
              'border border-[rgba(240,180,41,0.12)]',
              'rounded-[20px]',
              'shadow-xl',
              'max-h-[85vh] overflow-y-auto',
              maxWidthMap[maxWidth],
              className,
            )}
            style={{
              boxShadow: 'var(--shadow-xl), 0 0 40px rgba(240,180,41,0.08)',
            }}
            variants={desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-40" />

            {(title || showClose) && (
              <div className="flex items-center justify-between mb-4">
                {title && (
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {title}
                  </h3>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'ml-auto p-1.5 rounded-lg transition-all duration-200',
                      'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]',
                      'hover:bg-[var(--bg-surface-2)] hover:shadow-[0_0_12px_rgba(240,180,41,0.15)]',
                    )}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>

          <motion.div
            className={cn(
              'relative sm:hidden w-full rounded-t-[20px] rounded-b-none p-5 pb-8 safe-bottom',
              'max-h-[90vh] overflow-y-auto',
              'bg-surface backdrop-blur-3xl',
              'border border-b-0 border-[rgba(240,180,41,0.12)]',
              'shadow-xl',
              className,
            )}
            variants={mobileVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="w-10 h-1 rounded-full bg-[var(--text-tertiary)] mx-auto mb-4" />

            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-30" />

            {(title || showClose) && (
              <div className="flex items-center justify-between mb-4">
                {title && (
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {title}
                  </h3>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'ml-auto p-1.5 rounded-lg transition-all duration-200',
                      'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]',
                      'hover:bg-[var(--bg-surface-2)] hover:shadow-[0_0_12px_rgba(240,180,41,0.15)]',
                    )}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
