'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import type { TokenInfo } from '@/config/tokens';

interface SwapRouteProps {
  route: string[];
  getToken: (address: string) => TokenInfo | undefined;
}

export function SwapRoute({ route, getToken }: SwapRouteProps) {
  if (route.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mt-3 p-3.5 rounded-xl',
        'bg-[rgba(6,10,19,0.4)] border border-[rgba(56,189,248,0.04)]'
      )}
    >
      <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
        {t('swap.orderRouting')}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {route.map((address, idx) => {
          const token = getToken(address);
          return (
            <motion.div
              key={address}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-1.5"
            >
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                'bg-[rgba(15,23,42,0.6)] border border-[rgba(56,189,248,0.06)]',
                'hover:border-[rgba(6,182,212,0.15)] hover:shadow-[0_0_12px_rgba(6,182,212,0.04)]',
                'transition-all duration-200'
              )}>
                <TokenIcon address={address} symbol={token?.symbol || '?'} logoURI={token?.logoURI} size="xs" />
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  {token?.symbol || address.slice(0, 6)}
                </span>
              </div>
              {idx < route.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-primary)]/40 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
