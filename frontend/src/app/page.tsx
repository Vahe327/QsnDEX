'use client';

import { useState, useEffect } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingAI } from '@/components/landing/LandingAI';
import { LandingChains } from '@/components/landing/LandingChains';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingSecurity } from '@/components/landing/LandingSecurity';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { getLocale } from '@/i18n';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen" style={{ background: '#050810' }} />;
  }

  return (
    <div className="min-h-screen" key={getLocale()}>
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingAI />
      <LandingChains />
      <LandingStats />
      <LandingSecurity />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
