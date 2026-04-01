'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lock, Activity, Droplets, ShieldCheck } from 'lucide-react';
import { t } from '@/i18n';

interface StatItem {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  labelKey: string;
  value: string | null;
  prefix?: string;
  suffix?: string;
  numericValue: number | null;
}

function useCountUp(target: number | null, duration: number, inView: boolean): string {
  const [current, setCurrent] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || target === null || startedRef.current) return;
    startedRef.current = true;

    const finalTarget = target;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(finalTarget * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [target, duration, inView]);

  if (target === null) return '\u2014';
  return current.toLocaleString('en-US');
}

function StatCard({ stat, idx }: { stat: StatItem; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const displayValue = useCountUp(stat.numericValue, 1500, inView);
  const Icon = stat.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className="rounded-2xl p-6 sm:p-8 text-center"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 mx-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(240,180,41,0.1), rgba(217,119,6,0.08))',
          border: '1px solid rgba(240,180,41,0.15)',
        }}
      >
        <Icon className="w-6 h-6" style={{ color: '#B8860B' }} />
      </div>
      <p
        className="text-2xl sm:text-3xl md:text-4xl font-black mb-2"
        style={{
          fontFamily: 'var(--font-heading)',
          color: '#0A0E18',
        }}
      >
        {stat.prefix || ''}{displayValue}{stat.suffix || ''}
      </p>
      <p className="text-sm sm:text-base font-medium" style={{ color: '#5A5E6B' }}>
        {t(stat.labelKey)}
      </p>
    </motion.div>
  );
}

export function LandingStats() {
  const [stats, setStats] = useState<{
    tvl: number | null;
    volume24h: number | null;
    pools: number | null;
    checks: number | null;
  }>({
    tvl: null,
    volume24h: null,
    pools: null,
    checks: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats/all');
        if (res.ok) {
          const data = await res.json();
          setStats({
            tvl: data.tvl ?? null,
            volume24h: data.volume_24h ?? null,
            pools: data.total_pools ?? null,
            checks: data.ai_checks ?? null,
          });
        }
      } catch {}
    }
    fetchStats();
  }, []);

  const statItems: StatItem[] = [
    {
      icon: Lock,
      labelKey: 'landing.stats_tvl',
      value: stats.tvl !== null ? `$${stats.tvl.toLocaleString()}` : null,
      prefix: '$',
      numericValue: stats.tvl,
    },
    {
      icon: Activity,
      labelKey: 'landing.stats_volume',
      value: stats.volume24h !== null ? `$${stats.volume24h.toLocaleString()}` : null,
      prefix: '$',
      numericValue: stats.volume24h,
    },
    {
      icon: Droplets,
      labelKey: 'landing.stats_pools',
      value: stats.pools !== null ? stats.pools.toLocaleString() : null,
      numericValue: stats.pools,
    },
    {
      icon: ShieldCheck,
      labelKey: 'landing.stats_checks',
      value: stats.checks !== null ? stats.checks.toLocaleString() : null,
      numericValue: stats.checks,
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 px-4" style={{ background: '#FFF9ED' }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', color: '#0A0E18' }}
          >
            {t('landing.stats_title')}
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: '#5A5E6B' }}>
            {t('landing.stats_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statItems.map((stat, idx) => (
            <StatCard key={stat.labelKey} stat={stat} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
