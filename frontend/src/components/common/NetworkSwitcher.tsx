'use client';

import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { t } from '@/i18n';
import { SUPPORTED_CHAINS, CHAIN_CONFIG, type SupportedChainId, isSupportedChainId } from '@/config/chains';
import { useChain } from '@/hooks/useChain';
import { cn } from '@/lib/utils';

interface NetworkSwitcherProps {
  className?: string;
}

export function NetworkSwitcher({ className }: NetworkSwitcherProps) {
  const { chain, isConnected } = useAccount();
  const { switchToChain } = useChain();

  const isWrongNetwork = isConnected && chain?.id !== undefined && !isSupportedChainId(chain.id);

  return (
    <AnimatePresence>
      {isWrongNetwork && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn('overflow-hidden', className)}
        >
          <div
            className={cn(
              'card',
              'flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4',
              '!border-[var(--accent-danger)]/20',
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-danger)]/15 flex items-center justify-center shadow-[0_0_15px_rgba(255,59,92,0.2)]">
                <AlertTriangle size={20} className="text-[var(--accent-danger)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--accent-danger)]">
                  {t('chain.unsupported')}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t('chain.unsupported_desc')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-0 sm:ml-auto">
              {SUPPORTED_CHAINS.map((supportedChain) => {
                const config = CHAIN_CONFIG[supportedChain.id as SupportedChainId];
                return (
                  <button
                    key={supportedChain.id}
                    onClick={() => switchToChain(supportedChain.id as SupportedChainId)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-[14px] text-sm font-bold',
                      'text-white',
                      'hover:brightness-110 transition-all duration-200',
                    )}
                    style={{
                      background: config.color,
                      boxShadow: `0 0 16px ${config.color}30`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.logo}
                      alt={config.shortName}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    {config.shortName}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
