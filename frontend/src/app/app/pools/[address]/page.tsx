'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { PoolDetail } from '@/components/pools/PoolDetail';
import { MobilePoolDetail } from '@/components/mobile/MobilePoolDetail';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function PoolDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const isMobile = useIsMobile();

  if (isMobile) return <MobilePoolDetail address={address} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <PoolDetail poolAddress={address} />
      </motion.div>
    </div>
  );
}
