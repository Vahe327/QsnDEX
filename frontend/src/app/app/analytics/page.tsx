'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlobalStats } from '@/components/analytics/GlobalStats';
import { TopPools } from '@/components/analytics/TopPools';
import { TopTokens } from '@/components/analytics/TopTokens';
import { RecentSwaps } from '@/components/analytics/RecentSwaps';
import { TVLChart } from '@/components/charts/TVLChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { MobileAnalytics } from '@/components/mobile/MobileAnalytics';
import { useIsMobile } from '@/hooks/useIsMobile';
import { t } from '@/i18n';
import { CHAIN_CONFIG, type SupportedChainId } from '@/config/chains';
import { useChain } from '@/hooks/useChain';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const PERIOD_OPTIONS = ['24h', '7d', '30d', '90d'] as const;

type ChainTab = 'all' | SupportedChainId;

const CHAIN_TABS: { key: ChainTab; labelKey: string; logo?: string; color?: string }[] = [
  { key: 'all', labelKey: 'chain.all_chains' },
  {
    key: 167000,
    labelKey: 'chain.taiko',
    logo: CHAIN_CONFIG[167000].logo,
    color: CHAIN_CONFIG[167000].color,
  },
  {
    key: 42161,
    labelKey: 'chain.arbitrum',
    logo: CHAIN_CONFIG[42161].logo,
    color: CHAIN_CONFIG[42161].color,
  },
];

export default function AnalyticsPage() {
  const isMobile = useIsMobile();
  const { chainId: activeChainId } = useChain();
  const [chartPeriod, setChartPeriod] = useState<string>('7d');

  const effectiveChainId = activeChainId;

  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['statsChart', effectiveChainId, chartPeriod],
    queryFn: () => api.getStatsChart(chartPeriod, effectiveChainId),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const tvlChartData = (chartData?.chart ?? []).map((p: any) => ({
    time: p.time ?? p.timestamp ?? p.date,
    value: p.tvl ?? p.total_tvl ?? 0,
  }));

  const volumeChartData = (chartData?.chart ?? []).map((p: any) => ({
    time: p.time ?? p.timestamp ?? p.date,
    value: p.volume ?? p.volume_24h ?? 0,
  }));

  if (isMobile) return <MobileAnalytics />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:py-10">
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('analytics.title')}
          </h1>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlobalStats />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 flex items-center gap-2">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setChartPeriod(p)}
              className={
                chartPeriod === p
                  ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-primary)] text-white'
                  : 'px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--bg-surface-2)]'
              }
            >
              {p}
            </button>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {t('analytics.total_tvl')}
            </h2>
            <div className="h-[280px] sm:h-[320px]">
              <TVLChart data={tvlChartData} loading={isChartLoading} />
            </div>
          </div>
          <div className="card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {t('analytics.volume_24h')}
            </h2>
            <div className="h-[280px] sm:h-[320px]">
              <VolumeChart data={volumeChartData} loading={isChartLoading} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 grid gap-6 lg:grid-cols-2">
          <TopPools />
          <TopTokens />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6">
          <RecentSwaps />
        </motion.div>
      </motion.div>
    </div>
  );
}
