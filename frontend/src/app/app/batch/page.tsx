'use client';

import { BatchSwapCard } from '@/components/batch/BatchSwapCard';
import { MobileBatch } from '@/components/mobile/MobileBatch';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function BatchPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileBatch />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <BatchSwapCard />
    </div>
  );
}
