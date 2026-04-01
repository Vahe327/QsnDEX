'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Tabs } from '@/components/common/Tabs';
import { PoolList } from '@/components/pools/PoolList';
import { MyPositions } from '@/components/pools/MyPositions';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';
import { MobilePools } from '@/components/mobile/MobilePools';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';

export default function PoolsPage() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('pools.all_pools') },
    { id: 'my', label: t('pools.my_positions') },
  ];

  if (isMobile) return <MobilePools />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <NetworkSwitcher />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
              {t('pools.title')}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t('pools.subtitle')}
            </p>
          </div>
          <Link
            href="/app/pools/create"
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 !h-11 !text-sm !px-5"
          >
            <Plus size={18} />
            {t('pools.create_pool')}
          </Link>
        </div>

        <div className="mb-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === 'all' ? <PoolList /> : <MyPositions />}
      </motion.div>
    </div>
  );
}
