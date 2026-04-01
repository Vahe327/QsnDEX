'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Loader2, ExternalLink, LogOut } from 'lucide-react';
import { useAccount } from 'wagmi';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import type { StakingPoolUserInfo } from '@/hooks/useStakingPools';

interface ClaimRewardsButtonProps {
  rewardTokenSymbol: string;
  userInfo?: StakingPoolUserInfo;
  isLoadingUser: boolean;
  claim: () => Promise<string | undefined>;
  isClaiming: boolean;
  isClaimSuccess: boolean;
  claimHash?: string;
  exit: () => Promise<string | undefined>;
  isExiting: boolean;
  isExitSuccess: boolean;
  exitHash?: string;
  invalidateAll: () => void;
}

export function ClaimRewardsButton({
  rewardTokenSymbol,
  userInfo,
  isLoadingUser,
  claim,
  isClaiming,
  isClaimSuccess,
  claimHash,
  exit,
  isExiting,
  isExitSuccess,
  exitHash,
  invalidateAll,
}: ClaimRewardsButtonProps) {
  const { address } = useAccount();
  const { explorerUrl } = useChain();

  useEffect(() => {
    if (isClaimSuccess || isExitSuccess) {
      invalidateAll();
    }
  }, [isClaimSuccess, isExitSuccess, invalidateAll]);

  const pendingRewards = userInfo ? formatNumber(Number(userInfo.pending_rewards)) : '0.00';
  const pendingRewardsUsd = userInfo?.pending_rewards_usd ?? 0;
  const hasPending = userInfo && Number(userInfo.pending_rewards) > 0;
  const hasStaked = userInfo && Number(userInfo.staked_amount) > 0;

  const latestHash = claimHash || exitHash;
  const latestSuccess = isClaimSuccess || isExitSuccess;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="card p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(240, 180, 41, 0.1)',
            border: '1px solid rgba(240, 180, 41, 0.2)',
          }}
        >
          <Gift className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
          {t('staking_pools.pending_rewards')}
        </h2>
      </div>

      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="text-sm block mb-1" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
          {t('staking_pools.your_earned')}
        </span>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold"
            style={{
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              textShadow: '0 0 10px rgba(240, 180, 41, 0.3)',
            }}
          >
            {isLoadingUser ? '...' : `${pendingRewards} ${rewardTokenSymbol}`}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
          {isLoadingUser ? '' : formatUSD(pendingRewardsUsd)}
        </span>
      </div>

      <button
        onClick={claim}
        disabled={isClaiming || !hasPending || !address}
        className="btn-primary w-full py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-3"
      >
        {isClaiming && <Loader2 className="w-4 h-4 animate-spin" />}
        {isClaiming ? t('staking_pools.claiming') : t('staking_pools.claim_rewards')}
      </button>

      {hasStaked && (
        <button
          onClick={exit}
          disabled={isExiting || !address}
          className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--color-danger, #ef4444)',
            textShadow: '0 0 6px rgba(239, 68, 68, 0.2)',
          }}
        >
          {isExiting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          {isExiting ? t('staking_pools.exiting') : t('staking_pools.exit_pool')}
        </button>
      )}
      {hasStaked && (
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
          {t('staking_pools.exit_desc')}
        </p>
      )}

      {latestHash && latestSuccess && (
        <a
          href={`${explorerUrl}/tx/${latestHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-sm mt-3 transition-colors"
          style={{ color: 'var(--accent-primary)' }}
        >
          {t('staking_pools.view_on_explorer')} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </motion.div>
  );
}
