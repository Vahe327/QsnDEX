'use client';

import { SafetyCheck } from '@/components/safety/SafetyCheck';
import { MobileSafety } from '@/components/mobile/MobileSafety';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function SafetyPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileSafety />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SafetyCheck />
    </div>
  );
}
