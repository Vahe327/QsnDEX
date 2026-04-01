'use client';

import { useSearchParams } from 'next/navigation';
import { AutopilotDashboard } from '@/components/autopilot/AutopilotDashboard';
import { MobileAutopilot } from '@/components/mobile/MobileAutopilot';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function AutopilotPage() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const prefillToken = searchParams.get('token') || undefined;
  const prefillPrice = searchParams.get('price') || undefined;

  if (isMobile) {
    return <MobileAutopilot prefillToken={prefillToken} prefillPrice={prefillPrice} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <AutopilotDashboard prefillToken={prefillToken} prefillPrice={prefillPrice} />
    </div>
  );
}
