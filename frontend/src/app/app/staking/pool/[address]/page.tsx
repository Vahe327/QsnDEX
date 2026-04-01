'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { StakingPoolDetail } from '@/components/staking/StakingPoolDetail';
import { MobileStakingDetail } from '@/components/mobile/MobileStakingDetail';
import { useIsMobile } from '@/hooks/useIsMobile';

interface StakingPoolPageProps {
  params: Promise<{ address: string }>;
}

export default function StakingPoolPage({ params }: StakingPoolPageProps) {
  const { address } = use(params);
  const isMobile = useIsMobile();

  if (isMobile) return <MobileStakingDetail address={address} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <StakingPoolDetail poolAddress={address} />
      </motion.div>
    </div>
  );
}
