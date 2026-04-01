'use client';

import { motion } from 'framer-motion';
import { FarmList } from '@/components/farms/FarmList';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { MobileFarms } from '@/components/mobile/MobileFarms';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';

export default function FarmsPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileFarms />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <FarmList />
      </motion.div>
    </div>
  );
}
