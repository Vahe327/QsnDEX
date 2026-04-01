'use client';

import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { TokenBalances } from '@/components/portfolio/TokenBalances';
import { LPPositions } from '@/components/portfolio/LPPositions';
import { PnLDisplay } from '@/components/portfolio/PnLDisplay';
import { BridgeBanner } from '@/components/common/BridgeBanner';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { ConnectButton } from '@/components/common/ConnectButton';
import { MobilePortfolio } from '@/components/mobile/MobilePortfolio';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';

export default function PortfolioPage() {
  const isMobile = useIsMobile();
  const { isConnected } = useAccount();

  if (isMobile) return <MobilePortfolio />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('portfolio.title')}
        </h1>

        {!isConnected ? (
          <div className="card flex flex-col items-center justify-center gap-6 py-20 text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--gradient-glow)',
                boxShadow: '0 0 30px rgba(0,229,255,0.12)',
              }}
            >
              <Wallet size={36} className="text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{t('portfolio.connect_to_view')}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t('portfolio.connect_to_view_desc')}
              </p>
            </div>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            <BridgeBanner />
            <PortfolioSummary />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <TokenBalances />
                <LPPositions />
              </div>
              <div className="space-y-6">
                <PnLDisplay />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
