'use client';

import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { NetworkGuard } from '@/components/common/NetworkGuard';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <MobileHeader />
      <main
        className="flex-1"
        style={{
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <BottomNav />
      <NetworkGuard />
    </div>
  );
}
