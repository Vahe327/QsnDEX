'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { SaleList } from '@/components/launchpad/SaleList';
import { MobileLaunchpad } from '@/components/mobile/MobileLaunchpad';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';

export default function LaunchpadPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileLaunchpad />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('launchpad.title')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t('launchpad.subtitle')}</p>
        </div>
        <Link href="/app/launchpad/create" className="btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl min-h-[44px]">
          <Plus size={18} />
          {t('launchpad.create_sale')}
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <SaleList />
      </motion.div>
    </div>
  );
}
