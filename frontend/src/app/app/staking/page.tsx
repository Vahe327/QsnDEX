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
import { MobileStaking } from '@/components/mobile/MobileStaking';
import { useQsnStaking } from '@/hooks/useQsnStaking';
import { useChain } from '@/hooks/useChain';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function StakingPage() {
  const isMobile = useIsMobile();
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

  if (isMobile) return <MobileStaking />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <Coins size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold leading-tight"
                style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {t('staking.title')}
              </h1>
              <p
                className="text-xs"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
              >
                {t('staking.subtitle')}
              </p>
            </div>
          </div>

          {isTaiko ? (
            <>
              <StakingHero stakingInfo={stakingInfo} isLoading={isLoading} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
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
              </div>

              <div className="mt-4">
                <StakingStats stakingInfo={stakingInfo} isLoading={isLoading} />
              </div>
            </>
          ) : (
            <div className="card p-6 flex items-center gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(240,180,41,0.04))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <Clock size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3
                  className="text-base font-bold"
                  style={{ color: 'var(--accent-primary)', textShadow: '0 0 10px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {t('staking.coming_soon')}
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
                >
                  {t('staking.coming_soon_desc')}
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="gradient-divider" />

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold leading-tight"
                style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {t('staking_pools.title')}
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
              >
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
