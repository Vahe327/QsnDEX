'use client';

import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { t } from '@/i18n';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { TokenBalances } from '@/components/portfolio/TokenBalances';
import { LPPositions } from '@/components/portfolio/LPPositions';
import { PnLDisplay } from '@/components/portfolio/PnLDisplay';
import { BridgeBanner } from '@/components/common/BridgeBanner';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';

export function MobilePortfolio() {
  const { isConnected } = useAccount();

  return (
    <div className="px-3 pt-3 pb-4">
      <NetworkSwitcher />
      <BridgeBanner />

      <div className="mb-3">
        <h1
          className="text-xl font-bold font-[var(--font-heading)]"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('portfolio.title')}
        </h1>
      </div>

      {isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <PortfolioSummary />
          <TokenBalances />
          <LPPositions />
          <PnLDisplay />
        </motion.div>
      ) : (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(240,180,41,0.04))',
            }}
          >
            <Wallet className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('portfolio.connect_to_view')}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('portfolio.connect_to_view_desc')}
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  );
}
