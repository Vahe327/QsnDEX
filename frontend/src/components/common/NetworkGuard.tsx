'use client';

import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { SUPPORTED_CHAINS, CHAIN_CONFIG, isSupportedChainId, type SupportedChainId } from '@/config/chains';
import { useChain } from '@/hooks/useChain';

export function NetworkGuard() {
  const { chain, isConnected } = useAccount();
  const { switchToChain } = useChain();

  const showGuard = isConnected && chain?.id !== undefined && !isSupportedChainId(chain.id);

  return (
    <AnimatePresence>
      {showGuard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="card mx-4 max-w-md w-full p-6 text-center"
            style={{
              boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,180,41,0.1)',
            }}
          >
            <div
              className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,59,92,0.12)',
                boxShadow: '0 0 20px rgba(255,59,92,0.2)',
              }}
            >
              <AlertTriangle className="w-7 h-7 text-[var(--accent-danger)]" />
            </div>

            <h2
              className="text-lg font-bold mb-2"
              style={{
                color: 'var(--text-primary)',
                textShadow: '0 0 12px rgba(240,180,41,0.15)',
              }}
            >
              {t('chain.unsupported')}
            </h2>

            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {t('chain.unsupported_desc')}
            </p>

            <div className="flex flex-col gap-3">
              {SUPPORTED_CHAINS.map((supportedChain) => {
                const config = CHAIN_CONFIG[supportedChain.id as SupportedChainId];
                return (
                  <button
                    key={supportedChain.id}
                    onClick={() => switchToChain(supportedChain.id as SupportedChainId)}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[14px]',
                      'text-sm font-bold transition-all duration-200',
                      'hover:brightness-110',
                    )}
                    style={{
                      background: config.color,
                      color: 'white',
                      boxShadow: `0 0 20px ${config.color}40`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.logo}
                      alt={config.shortName}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    {t('chain.switch_to', { name: config.shortName })}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
