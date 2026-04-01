'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, ChevronDown } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { shortenAddress } from '@/lib/formatters';

interface ConnectButtonProps {
  className?: string;
  compact?: boolean;
}

export function ConnectButton({ className, compact = false }: ConnectButtonProps) {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            className={cn(!ready && 'opacity-0 pointer-events-none select-none')}
            aria-hidden={!ready}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className={cn(
                  'btn-primary h-11 px-5 text-sm font-semibold gap-2',
                  className,
                )}
              >
                <Wallet size={16} />
                {!compact && t('common.connect_wallet')}
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className={cn(
                  'h-11 px-4 rounded-[14px] font-semibold text-sm',
                  'bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]',
                  'border border-[var(--accent-danger)]/30',
                  'hover:bg-[var(--accent-danger)]/30 transition-all duration-200',
                  'shadow-[0_0_15px_rgba(255,59,92,0.15)]',
                  className,
                )}
              >
                {t('common.wrong_network')}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openChainModal}
                  className={cn(
                    'h-11 px-3 rounded-[14px] flex items-center gap-1.5',
                    'bg-[var(--bg-surface)]/60 backdrop-blur-xl',
                    'border border-[var(--border-subtle)]',
                    'hover:border-[var(--border-glow)] transition-all duration-200 text-sm',
                    'hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]',
                  )}
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img
                      src={chain.iconUrl}
                      alt={chain.name ?? 'Chain'}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  {!compact && (
                    <ChevronDown size={14} className="text-[var(--text-secondary)]" />
                  )}
                </button>

                <button
                  onClick={openAccountModal}
                  className={cn(
                    'h-11 px-4 rounded-[14px] flex items-center gap-2',
                    'bg-[var(--bg-surface)]/60 backdrop-blur-xl',
                    'border border-[var(--border-glow)]',
                    'hover:border-[var(--border-active)] transition-all duration-200',
                    'hover:shadow-[0_0_16px_rgba(0,229,255,0.1)]',
                    'font-mono text-sm',
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-tertiary)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-tertiary)]" />
                  </span>

                  {account.displayBalance && !compact && (
                    <span className="text-[var(--text-secondary)]">
                      {account.displayBalance}
                    </span>
                  )}
                  <span className="text-[var(--text-primary)]">
                    {shortenAddress(account.address)}
                  </span>
                </button>
              </div>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
