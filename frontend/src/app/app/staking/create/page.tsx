'use client';

import { motion } from 'framer-motion';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { CreateStakingPoolForm } from '@/components/staking/CreateStakingPoolForm';
import { MobileCreateStakingPool } from '@/components/mobile/MobileCreateStakingPool';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function CreateStakingPoolPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileCreateStakingPool />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <CreateStakingPoolForm />
      </motion.div>
    </div>
  );
}
