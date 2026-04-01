'use client';

import { useAccount, useBalance } from 'wagmi';
import { ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useChain } from '@/hooks/useChain';

const MIN_ETH_THRESHOLD = 0.001;

interface BridgeBannerProps {
  className?: string;
}

export function BridgeBanner({ className }: BridgeBannerProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { chainConfig, bridgeUrl } = useChain();

  const ethBalance = balance ? Number(balance.formatted) : null;
  const showBanner = isConnected && ethBalance !== null && ethBalance < MIN_ETH_THRESHOLD;

  const chainName = chainConfig?.shortName ?? 'Taiko';
  const bridgeHost = bridgeUrl ? new URL(bridgeUrl).host : 'bridge.taiko.xyz';

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn('overflow-hidden', className)}
        >
          <a
            href={bridgeUrl || 'https://bridge.taiko.xyz'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'card',
              'flex items-center gap-3 p-4',
              '!border-[var(--accent-primary)]/20',
              'hover:!border-[var(--accent-primary)]/40 transition-all duration-200 group',
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpDown size={18} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {t('common.need_eth')} {chainName}?
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
                {t('common.bridge_eth')} via {bridgeHost}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
