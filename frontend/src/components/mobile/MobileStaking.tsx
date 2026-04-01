'use client';

import { motion } from 'framer-motion';
import { Coins, Layers, Clock } from 'lucide-react';
import { t } from '@/i18n';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { StakingHero } from '@/components/staking/StakingHero';
import { StakeCard } from '@/components/staking/StakeCard';
import { RewardsCard } from '@/components/staking/RewardsCard';
import { StakingStats } from '@/components/staking/StakingStats';
import { StakingPoolList } from '@/components/staking/StakingPoolList';
import { useQsnStaking } from '@/hooks/useQsnStaking';
import { useChain } from '@/hooks/useChain';

export function MobileStaking() {
  const {
    stakingInfo,
    userInfo,
    isLoading,
    isLoadingUser,
    contracts,
    approveQsn,
    stake,
    unstake,
    claim,
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
  } = useQsnStaking();
  const { chainId } = useChain();
  const isTaiko = chainId === 167000;

  return (
    <div className="px-3 pt-3 pb-4">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-5"
      >
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))',
              }}
            >
              <Coins size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold font-[var(--font-heading)]"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('staking.title')}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('staking.subtitle')}
              </p>
            </div>
          </div>

          {isTaiko ? (
            <div className="space-y-3">
              <StakingHero stakingInfo={stakingInfo} isLoading={isLoading} />

              <StakeCard
                userInfo={userInfo}
                isLoadingUser={isLoadingUser}
                contracts={{ qsnToken: contracts.qsnToken ?? '', stakeVault: contracts.stakeVault ?? '' }}
                approveQsn={approveQsn}
                stake={stake}
                unstake={unstake}
                isApproving={isApproving}
                isStaking={isStaking}
                isUnstaking={isUnstaking}
                invalidateAll={invalidateAll}
                isStakeSuccess={isStakeSuccess}
                isUnstakeSuccess={isUnstakeSuccess}
                isApproveSuccess={isApproveSuccess}
              />

              <RewardsCard
                userInfo={userInfo}
                isLoadingUser={isLoadingUser}
                claim={claim}
                isClaiming={isClaiming}
                isClaimSuccess={isClaimSuccess}
                claimHash={claimHash}
                invalidateAll={invalidateAll}
              />

              <StakingStats stakingInfo={stakingInfo} isLoading={isLoading} />
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(240,180,41,0.04))',
                }}
              >
                <Clock size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {t('staking.coming_soon')}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {t('staking.coming_soon_desc')}
                </p>
              </div>
            </div>
          )}
        </section>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))',
              }}
            >
              <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold font-[var(--font-heading)]"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('staking_pools.title')}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('staking_pools.subtitle')}
              </p>
            </div>
          </div>

          <StakingPoolList />
        </section>
      </motion.div>
    </div>
  );
}
