'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { GlobalStats } from '@/components/analytics/GlobalStats';
import { TVLChart } from '@/components/charts/TVLChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { TopPools } from '@/components/analytics/TopPools';
import { TopTokens } from '@/components/analytics/TopTokens';
import { RecentSwaps } from '@/components/analytics/RecentSwaps';
import { NetworkSwitcher } from '@/components/common/NetworkSwitcher';

type Period = '24h' | '7d' | '30d' | '90d';

export function MobileAnalytics() {
  const [period, setPeriod] = useState<Period>('24h');
  const [activeSection, setActiveSection] = useState<'overview' | 'pools' | 'tokens' | 'swaps'>('overview');

  return (
    <div className="px-3 pt-3 pb-4">
      <NetworkSwitcher />

      <h1
        className="text-xl font-bold font-[var(--font-heading)] mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {t('analytics.title')}
      </h1>

      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
        {(['24h', '7d', '30d', '90d'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[32px]',
              period === p
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-tertiary)]'
            )}
            style={{
              background: period === p ? 'var(--gradient-glow)' : 'var(--bg-surface-2)',
              border: `1px solid ${period === p ? 'var(--border-active)' : 'var(--border-subtle)'}`,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
        {[
          { key: 'overview' as const, label: t('analytics.total_tvl') },
          { key: 'pools' as const, label: t('analytics.top_pools') },
          { key: 'tokens' as const, label: t('analytics.top_tokens') },
          { key: 'swaps' as const, label: t('analytics.recent_swaps') },
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px]',
              activeSection === section.key
                ? 'text-white'
                : 'text-[var(--text-tertiary)]'
            )}
            style={
              activeSection === section.key
                ? { background: 'var(--gradient-primary)' }
                : { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }
            }
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlobalStats />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <TVLChart />
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <VolumeChart />
          </div>
        </motion.div>
      )}

      {activeSection === 'pools' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TopPools />
        </motion.div>
      )}

      {activeSection === 'tokens' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TopTokens />
        </motion.div>
      )}

      {activeSection === 'swaps' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RecentSwaps />
        </motion.div>
      )}
    </div>
  );
}
