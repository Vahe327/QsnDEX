'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Loader2 } from 'lucide-react';
import { t } from '@/i18n';
import { useLaunchpadSales } from '@/hooks/useLaunchpad';
import { SaleCard } from './SaleCard';

type TabStatus = 'active' | 'upcoming' | 'ended';

const TABS: TabStatus[] = ['active', 'upcoming', 'ended'];

export function SaleList() {
  const [activeTab, setActiveTab] = useState<TabStatus>('active');
  const { sales: allSales, isLoading, error } = useLaunchpadSales();
  const sales = allSales.filter((s) => s.status === activeTab);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <h1
          className="text-3xl font-bold mb-2 gradient-text"
          style={{ display: 'inline-block' }}
        >
          {t('launchpad.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('launchpad.subtitle')}</p>
      </motion.div>

      <div
        className="flex rounded-xl p-1 mb-6 w-fit"
        style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab ? 'var(--shadow-card)' : 'none',
            }}
          >
            {t(`launchpad.tab_${tab}`)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )}

      {error && !isLoading && (
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>{t('launchpad.error_loading')}</p>
        </div>
      )}

      {!isLoading && !error && sales.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <Rocket
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('launchpad.no_sales')}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {t('launchpad.no_sales_desc')}
          </p>
        </motion.div>
      )}

      {!isLoading && !error && sales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sales.map((sale, idx) => (
            <SaleCard key={sale.id} sale={sale} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
