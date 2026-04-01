'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreatePool } from '@/components/pools/CreatePool';
import { MobilePoolCreate } from '@/components/mobile/MobilePoolCreate';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';

export default function CreatePoolPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobilePoolCreate />;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/app/pools"
            className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('pools.create_pool')}
          </h1>
        </div>
        <CreatePool />
      </motion.div>
    </div>
  );
}
