'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, BarChart3, Coins, ExternalLink, Copy } from 'lucide-react';
import Link from 'next/link';
import { t } from '@/i18n';
import { formatNumber, formatUSD, shortenAddress } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import { useStakingPool, useStakingPoolActions } from '@/hooks/useStakingPools';
import { APRBadge } from './APRBadge';
import { PoolCountdown } from './PoolCountdown';
import { StakeForm } from './StakeForm';
import { ClaimRewardsButton } from './ClaimRewardsButton';

interface StakingPoolDetailProps {
  poolAddress: string;
}

export function StakingPoolDetail({ poolAddress }: StakingPoolDetailProps) {
  const { explorerUrl } = useChain();
  const { pool, userInfo, isLoadingPool, isLoadingUser } = useStakingPool(poolAddress);

  const {
    approveStakeToken,
    stake,
    unstake,
    claim,
    exit,
    invalidateAll,
    isApproving,
    isApproveSuccess,
    isStaking,
    isStakeSuccess,
    isUnstaking,
    isUnstakeSuccess,
    isClaiming,
    isClaimSuccess,
    claimHash,
    isExiting,
    isExitSuccess,
    exitHash,
  } = useStakingPoolActions(
    poolAddress,
    pool?.stake_token,
    pool?.stake_token_decimals
  );

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
  };

  if (isLoadingPool) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
          {t('staking_pools.no_pools')}
        </p>
        <Link href="/app/staking" className="mt-4 inline-block text-sm" style={{ color: 'var(--accent-primary)' }}>
          {t('staking_pools.back_to_pools')}
        </Link>
      </div>
    );
  }

  const rewardRatePerDay = Number(pool.reward_rate) * 86400;
  const endDate = new Date(pool.period_finish * 1000);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Link
          href="/app/staking"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('staking_pools.back_to_pools')}
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(240, 180, 41, 0.15), rgba(240, 180, 41, 0.05))',
              border: '1px solid rgba(240, 180, 41, 0.2)',
              color: 'var(--accent-primary)',
              textShadow: '0 0 6px rgba(240, 180, 41, 0.3)',
            }}
          >
            {pool.stake_token_symbol?.slice(0, 3) ?? '?'}
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              textShadow: '0 0 6px rgba(99, 102, 241, 0.3)',
            }}
          >
            {pool.reward_token_symbol?.slice(0, 3) ?? '?'}
          </div>
        </div>
        <div>
          <h1
            className="text-2xl font-bold gradient-text"
            style={{ display: 'inline-block' }}
          >
            {pool.stake_token_symbol} {'\u2192'} {pool.reward_token_symbol}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <PoolCountdown periodFinish={pool.period_finish} />
            <APRBadge apr={pool.apr} size="md" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(240, 180, 41, 0.08)', border: '1px solid rgba(240, 180, 41, 0.15)' }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.apr')}
            </span>
          </div>
          <span
            className="text-xl font-bold"
            style={{
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              textShadow: '0 0 10px rgba(240, 180, 41, 0.3)',
            }}
          >
            {pool.apr.toFixed(2)}%
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(240, 180, 41, 0.08)', border: '1px solid rgba(240, 180, 41, 0.15)' }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.tvl')}
            </span>
          </div>
          <span
            className="text-xl font-bold"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              textShadow: '0 0 6px rgba(0,0,0,0.3)',
            }}
          >
            {formatUSD(pool.total_staked_usd)}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(240, 180, 41, 0.08)', border: '1px solid rgba(240, 180, 41, 0.15)' }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.stakers')}
            </span>
          </div>
          <span
            className="text-xl font-bold"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              textShadow: '0 0 6px rgba(0,0,0,0.3)',
            }}
          >
            {formatNumber(pool.stakers_count)}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(240, 180, 41, 0.08)', border: '1px solid rgba(240, 180, 41, 0.15)' }}
            >
              <Coins className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.remaining_rewards')}
            </span>
          </div>
          <span
            className="text-xl font-bold"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              textShadow: '0 0 6px rgba(0,0,0,0.3)',
            }}
          >
            {formatUSD(pool.remaining_rewards_usd)}
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StakeForm
          poolAddress={poolAddress}
          stakeTokenAddress={pool.stake_token}
          stakeTokenSymbol={pool.stake_token_symbol}
          stakeTokenDecimals={pool.stake_token_decimals}
          userInfo={userInfo}
          isLoadingUser={isLoadingUser}
          approveStakeToken={approveStakeToken}
          stake={stake}
          unstake={unstake}
          isApproving={isApproving}
          isStaking={isStaking}
          isUnstaking={isUnstaking}
          isApproveSuccess={isApproveSuccess}
          isStakeSuccess={isStakeSuccess}
          isUnstakeSuccess={isUnstakeSuccess}
          invalidateAll={invalidateAll}
        />

        <ClaimRewardsButton
          rewardTokenSymbol={pool.reward_token_symbol}
          userInfo={userInfo}
          isLoadingUser={isLoadingUser}
          claim={claim}
          isClaiming={isClaiming}
          isClaimSuccess={isClaimSuccess}
          claimHash={claimHash}
          exit={exit}
          isExiting={isExiting}
          isExitSuccess={isExitSuccess}
          exitHash={exitHash}
          invalidateAll={invalidateAll}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
          {t('staking_pools.pool_info')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.stake_token')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
                {pool.stake_token_symbol}
              </span>
              <button onClick={() => handleCopyAddress(pool.stake_token)} className="opacity-50 hover:opacity-100 transition-opacity">
                <Copy className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </button>
              <a
                href={`${explorerUrl}/address/${pool.stake_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {shortenAddress(pool.stake_token)}
            </span>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.reward_token')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
                {pool.reward_token_symbol}
              </span>
              <button onClick={() => handleCopyAddress(pool.reward_token)} className="opacity-50 hover:opacity-100 transition-opacity">
                <Copy className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </button>
              <a
                href={`${explorerUrl}/address/${pool.reward_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {shortenAddress(pool.reward_token)}
            </span>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.pool_address')}
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  textShadow: '0 0 6px rgba(0,0,0,0.3)',
                }}
              >
                {shortenAddress(poolAddress)}
              </span>
              <button onClick={() => handleCopyAddress(poolAddress)} className="opacity-50 hover:opacity-100 transition-opacity">
                <Copy className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </button>
              <a
                href={`${explorerUrl}/address/${poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.reward_rate')}
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                textShadow: '0 0 6px rgba(0,0,0,0.3)',
              }}
            >
              {formatNumber(rewardRatePerDay)} {pool.reward_token_symbol} {t('staking_pools.per_day')}
            </span>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.pool_creator')}
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  textShadow: '0 0 6px rgba(0,0,0,0.3)',
                }}
              >
                {shortenAddress(pool.creator)}
              </span>
              <a
                href={`${explorerUrl}/address/${pool.creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
              {t('staking_pools.end_date')}
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                textShadow: '0 0 6px rgba(0,0,0,0.3)',
              }}
            >
              {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
