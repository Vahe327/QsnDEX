'use client';

import { useState, useRef, useEffect } from 'react';
/* eslint-disable @next/next/no-img-element */
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Wallet, LogOut } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useChain } from '@/hooks/useChain';
import { CHAIN_CONFIG, SUPPORTED_CHAINS, type SupportedChainId } from '@/config/chains';
import { shortenAddress } from '@/lib/formatters';

export function MobileChainSelector() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { chainId, chainConfig, switchToChain } = useChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handlePress() {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    setOpen(!open);
  }

  function handleSwitch(targetChainId: SupportedChainId) {
    if (targetChainId !== chainId) {
      switchToChain(targetChainId);
    }
    setOpen(false);
  }

  function handleDisconnect() {
    disconnect();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handlePress}
        className={cn(
          'flex items-center gap-2 h-9 px-2.5 rounded-xl',
          'border transition-all duration-200 text-sm font-semibold min-h-[44px]',
          open
            ? 'border-[var(--border-active)] text-[var(--accent-primary)]'
            : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
        )}
        style={{ background: 'var(--bg-surface-alpha)' }}
      >
        {isConnected ? (
          <>
            <img
              src={chainConfig.logo}
              alt={chainConfig.shortName}
              width={18}
              height={18}
              className="rounded-full"
            />
            <span className="text-xs font-[var(--font-mono)] max-w-[72px] truncate">
              {shortenAddress(address || '')}
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span className="text-xs">{t('common.connect_wallet')}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(240,180,41,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('chain.select_network')}
              </span>
            </div>

            <div className="py-1">
              {SUPPORTED_CHAINS.map((chain) => {
                const config = CHAIN_CONFIG[chain.id as SupportedChainId];
                const isActive = chain.id === chainId;

                return (
                  <button
                    key={chain.id}
                    onClick={() => handleSwitch(chain.id as SupportedChainId)}
                    disabled={false}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors min-h-[48px] disabled:opacity-50',
                      isActive
                        ? 'text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] active:bg-[var(--bg-surface-2)]'
                    )}
                    style={isActive ? { background: 'rgba(240, 180, 41, 0.05)' } : undefined}
                  >
                    <img
                      src={config.logo}
                      alt={config.shortName}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="flex-1 text-left text-sm font-semibold">
                      {config.name}
                    </span>
                    {isActive && (
                      <Check className="w-4 h-4 text-[var(--accent-primary)]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] transition-colors active:bg-[var(--bg-surface-2)]"
                style={{ color: 'var(--accent-danger)' }}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {t('mobile.disconnect')}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
