'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { SaleDetail } from '@/components/launchpad/SaleDetail';
import { MobileSaleDetail } from '@/components/mobile/MobileSaleDetail';
import { useIsMobile } from '@/hooks/useIsMobile';

interface LaunchpadSalePageProps {
  params: Promise<{ id: string }>;
}

export default function LaunchpadSalePage({ params }: LaunchpadSalePageProps) {
  const { id } = use(params);
  const isMobile = useIsMobile();

  if (isMobile) return <MobileSaleDetail id={id} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <SaleDetail saleId={id} />
      </motion.div>
    </div>
  );
}
