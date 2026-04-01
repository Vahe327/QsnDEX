'use client';

import { useState, useRef, useEffect } from 'react';
/* eslint-disable @next/next/no-img-element */
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useChain } from '@/hooks/useChain';
import { CHAIN_CONFIG, SUPPORTED_CHAINS, type SupportedChainId } from '@/config/chains';

export function ChainSwitcher() {
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

  function handleSwitch(targetChainId: SupportedChainId) {
    if (targetChainId !== chainId) {
      switchToChain(targetChainId);
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-xl',
          'border transition-all duration-200 text-sm font-semibold',
          open
            ? 'border-[var(--border-active)] text-[var(--accent-primary)]'
            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)]'
        )}
        style={{ background: 'var(--bg-surface-alpha)' }}
        aria-label={t('chain.select_network')}
      >
        <img
          src={chainConfig.logo}
          alt={chainConfig.shortName}
          width={18}
          height={18}
          className="rounded-full"
        />
        <span className="hidden sm:inline">{chainConfig.shortName}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
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
              <span
                className="text-sm font-bold"
                style={{
                  color: 'var(--text-primary)',
                  textShadow: '0 0 12px rgba(240,180,41,0.15)',
                }}
              >
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
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 transition-colors',
                      isActive
                        ? 'text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                    <div className="flex-1 text-left">
                      <span className="text-sm font-semibold">{config.name}</span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-[var(--accent-primary)]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              className="px-4 py-3"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <span
                className="text-[10px] uppercase font-bold tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('chain.bridge')}
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                {SUPPORTED_CHAINS.map((chain) => {
                  const config = CHAIN_CONFIG[chain.id as SupportedChainId];
                  return (
                    <a
                      key={chain.id}
                      href={config.bridgeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <img
                        src={config.logo}
                        alt={config.shortName}
                        width={14}
                        height={14}
                        className="rounded-full"
                      />
                      <span>{t('chain.bridge_to', { name: config.shortName })}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
