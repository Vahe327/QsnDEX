'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { NetworkGuard } from '@/components/common/NetworkGuard';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex-1" />
      </div>
    );
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
      <NetworkGuard />
    </div>
  );
}
