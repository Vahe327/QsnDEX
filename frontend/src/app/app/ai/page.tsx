'use client';

import { motion } from 'framer-motion';
import { AIChat } from '@/components/ai/AIChat';
import { AIDisclaimer } from '@/components/ai/AIDisclaimer';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { MobileAI } from '@/components/mobile/MobileAI';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';

export default function AIPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileAI />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('ai.title')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t('ai.subtitle')}
          </p>
        </div>

        <div style={{ minHeight: 'calc(100vh - 280px)' }}>
          <AIChat />
        </div>

        <div className="mt-4">
          <AIDisclaimer variant="inline" />
        </div>
      </motion.div>
    </div>
  );
}
