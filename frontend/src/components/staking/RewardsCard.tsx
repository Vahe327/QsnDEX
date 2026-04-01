'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Loader2, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import type { StakingUser } from '@/hooks/useQsnStaking';

interface RewardsCardProps {
  userInfo?: StakingUser;
  isLoadingUser: boolean;
  claim: () => Promise<string | undefined>;
  isClaiming: boolean;
  isClaimSuccess: boolean;
  claimHash?: string;
  invalidateAll: () => void;
}

export function RewardsCard({
  userInfo,
  isLoadingUser,
  claim,
  isClaiming,
  isClaimSuccess,
  claimHash,
  invalidateAll,
}: RewardsCardProps) {
  const { address } = useAccount();
  const { explorerUrl } = useChain();

  useEffect(() => {
    if (isClaimSuccess) {
      invalidateAll();
    }
  }, [isClaimSuccess, invalidateAll]);

  const pendingRewards = userInfo ? formatNumber(Number(userInfo.pending_rewards)) : '0.00';
  const pendingRewardsUsd = userInfo?.pending_rewards_usd ?? 0;
  const totalClaimed = userInfo ? formatNumber(Number(userInfo.total_claimed)) : '0.00';
  const totalClaimedUsd = userInfo?.total_claimed_usd ?? 0;
  const hasPending = userInfo && Number(userInfo.pending_rewards) > 0;

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
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('staking.rewards')}
        </h2>
      </div>

      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>
          {t('staking.pending_rewards')}
        </span>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold"
            style={{
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            }}
          >
            {isLoadingUser ? '...' : `${pendingRewards} WETH`}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {isLoadingUser ? '' : formatUSD(pendingRewardsUsd)}
        </span>
      </div>

      <button
        onClick={claim}
        disabled={isClaiming || !hasPending || !address}
        className="btn-primary w-full py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
      >
        {isClaiming && <Loader2 className="w-4 h-4 animate-spin" />}
        {isClaiming ? t('staking.claiming') : t('staking.claim_rewards')}
      </button>

      {claimHash && isClaimSuccess && (
        <a
          href={`${explorerUrl}/tx/${claimHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-sm mb-4 transition-colors"
          style={{ color: 'var(--accent-primary)' }}
        >
          {t('common.view_explorer')} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>
          {t('staking.total_claimed')}
        </span>
        <span
          className="text-lg font-semibold"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          }}
        >
          {isLoadingUser ? '...' : `${totalClaimed} WETH`}
        </span>
        <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
          {isLoadingUser ? '' : formatUSD(totalClaimedUsd)}
        </span>
      </div>
    </motion.div>
  );
}
