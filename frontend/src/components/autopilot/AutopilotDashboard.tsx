'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Wallet,
  Bot,
  DollarSign,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useAutopilot } from '@/hooks/useAutopilot';
import { PortfolioHealth } from './PortfolioHealth';
import { SuggestionCard } from './SuggestionCard';
import { AutopilotSettings } from './AutopilotSettings';
import { AlertsPanel } from './AlertsPanel';

interface AutopilotDashboardProps {
  className?: string;
  prefillToken?: string;
  prefillPrice?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg', className)}
      style={{ backgroundColor: 'var(--bg-surface-2)' }}
    />
  );
}

function ConnectWalletCTA() {
  return (
    <motion.div
      className={cn(
        'card',
        'flex flex-col items-center justify-center gap-4 py-16 px-6',
        'text-center',
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
        }}
      >
        <Wallet size={28} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <div className="flex flex-col gap-1">
        <h2
          className="text-lg font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('autopilot.connect_wallet_title')}
        </h2>
        <p
          className="text-sm max-w-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('autopilot.connect_wallet_desc')}
        </p>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className={cn(
        'card',
        'flex flex-col items-center justify-center gap-3 py-12 px-6',
        'text-center',
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-tertiary) 12%, transparent)',
        }}
      >
        <CheckCircle2 size={24} style={{ color: 'var(--accent-tertiary)' }} />
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('autopilot.no_suggestions')}
      </p>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <SkeletonBlock className="w-[100px] h-[100px] rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1 w-full">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-8 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </div>
      <SkeletonBlock className="h-20" />
    </div>
  );
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function AutopilotDashboard({ className, prefillToken, prefillPrice }: AutopilotDashboardProps) {
  const { address, isConnected } = useAccount();
  const { data, isLoading, error, refetch } = useAutopilot(address);

  if (!isConnected || !address) {
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        <Header />
        <ConnectWalletCTA />
      </div>
    );
  }

  const showAlertsPrefilled = !!(prefillToken || prefillPrice);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Header />

      {isLoading && !data && <LoadingSkeleton />}

      {error && !data && (
        <motion.div
          className="rounded-xl p-4 text-center"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
            border: '1px solid var(--accent-danger)',
            color: 'var(--accent-danger)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm font-medium">
            {t('autopilot.error_loading')}
          </p>
        </motion.div>
      )}

      {data && (
        <motion.div
          className="flex flex-col gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={cn(
              'card',
              'flex flex-col sm:flex-row items-center gap-6 p-5',
            )}
          >
            <PortfolioHealth score={data.health_score} size={100} />

            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span
                className="text-xs font-medium uppercase tracking-wider field-label"
              >
                {t('autopilot.portfolio_value')}
              </span>
              <span
                className="text-2xl font-bold display-number"
              >
                {formatUsd(data.portfolio_value_usd)}
              </span>
              {data.cached && (
                <span
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('autopilot.cached_result')}
                </span>
              )}
            </div>
          </div>

          {data.suggestions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3
                className="text-sm font-semibold flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                {t('autopilot.suggestions_title', { count: data.suggestions.length })}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <SuggestionCard suggestion={suggestion} />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}

          <AutopilotSettings
            scannedAt={data.scanned_at}
            onRescan={refetch}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      <AlertsPanel
        prefillToken={prefillToken}
        prefillPrice={prefillPrice}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
        }}
      >
        <Bot size={20} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <div className="flex flex-col">
        <h1
          className="text-lg font-bold leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('autopilot.title')}
        </h1>
        <p
          className="text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('autopilot.subtitle')}
        </p>
      </div>
    </div>
  );
}
