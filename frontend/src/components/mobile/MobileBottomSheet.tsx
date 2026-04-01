'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
  showHandle?: boolean;
  showClose?: boolean;
}

export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  fullScreen = false,
  showHandle = true,
  showClose = true,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed left-0 right-0 bottom-0 z-[101] overflow-hidden',
              fullScreen ? 'top-0' : 'max-h-[90vh]',
              className
            )}
            style={{
              background: 'var(--bg-surface)',
              borderTopLeftRadius: fullScreen ? 0 : 20,
              borderTopRightRadius: fullScreen ? 0 : 20,
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.5)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {showHandle && !fullScreen && (
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--text-tertiary)', opacity: 0.5 }}
                />
              </div>
            )}

            {(title || showClose) && (
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <h3
                  className="text-base font-semibold font-[var(--font-heading)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title || ''}
                </h3>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-surface-2)',
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            <div
              className={cn(
                'overflow-y-auto overscroll-contain',
                fullScreen ? 'flex-1' : 'max-h-[calc(90vh-80px)]'
              )}
              style={fullScreen ? { height: 'calc(100vh - 60px)' } : undefined}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
