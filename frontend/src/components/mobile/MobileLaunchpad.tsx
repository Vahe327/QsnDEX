'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Loader2, Users, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD } from '@/lib/formatters';
import { useLaunchpadSales, type LaunchpadSale } from '@/hooks/useLaunchpad';

type TabStatus = 'active' | 'upcoming' | 'ended';

function MobileSaleCard({ sale, index }: { sale: LaunchpadSale; index: number }) {
  const router = useRouter();
  const progress = sale.hard_cap
    ? (parseFloat(sale.total_raised) / parseFloat(sale.hard_cap)) * 100
    : 0;

  const statusColors: Record<string, string> = {
    active: 'var(--accent-tertiary)',
    upcoming: 'var(--accent-primary)',
    ended: 'var(--text-tertiary)',
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      onClick={() => router.push(`/app/launchpad/${sale.id}`)}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold"
            style={{
              background: 'var(--gradient-glow)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-glow)',
            }}
          >
            {sale.token_symbol?.slice(0, 2) || '?'}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {sale.token_name}
            </div>
            <div className="text-xs font-[var(--font-mono)]" style={{ color: 'var(--text-secondary)' }}>
              {sale.token_symbol}
            </div>
          </div>
        </div>
        <span
          className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg"
          style={{
            color: statusColors[sale.status] || 'var(--text-tertiary)',
            background: `color-mix(in srgb, ${statusColors[sale.status] || 'var(--text-tertiary)'} 10%, transparent)`,
          }}
        >
          {t(`launchpad.status_${sale.status}`)}
        </span>
      </div>

      <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
        {t('launchpad.token_price')}:{' '}
        <span className="font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
          {formatUSD(sale.price_usd)}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: 'var(--text-tertiary)' }}>{t('launchpad.raised')}</span>
          <span className="font-[var(--font-mono)]" style={{ color: 'var(--text-secondary)' }}>
            {formatUSD(sale.total_raised_usd)} / {formatUSD(parseFloat(sale.hard_cap) * sale.price_usd)}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: 'var(--gradient-primary)',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
          <Users className="w-3 h-3" />
          {sale.participants}
        </div>
        <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
          <Clock className="w-3 h-3" />
          {sale.status === 'active' && t('launchpad.ends_in')}
          {sale.status === 'upcoming' && t('launchpad.starts_in')}
          {sale.status === 'ended' && t('launchpad.ended_label')}
        </div>
      </div>
    </motion.button>
  );
}

export function MobileLaunchpad() {
  const [activeTab, setActiveTab] = useState<TabStatus>('active');
  const { sales: allSales, isLoading, error } = useLaunchpadSales();
  const sales = allSales.filter((s) => s.status === activeTab);

  return (
    <div className="px-3 pt-3 pb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))' }}
        >
          <Rocket className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
            {t('launchpad.title')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('launchpad.subtitle')}
          </p>
        </div>
      </div>

      <Link href="/app/launchpad/create" className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-2xl mb-4 min-h-[44px] font-semibold">
        <Plus size={18} />
        {t('launchpad.create_sale')}
      </Link>

      <div
        className="flex gap-1 p-1 rounded-xl mb-4"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
      >
        {(['active', 'upcoming', 'ended'] as TabStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[40px]',
              activeTab === tab ? 'text-white' : 'text-[var(--text-tertiary)]'
            )}
            style={activeTab === tab ? { background: 'var(--gradient-primary)' } : undefined}
          >
            {t(`launchpad.tab_${tab}`)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('launchpad.error_loading')}
          </p>
        </div>
      )}

      {!isLoading && !error && sales.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <Rocket className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--accent-primary)' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {t('launchpad.no_sales')}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('launchpad.no_sales_desc')}
          </p>
        </div>
      )}

      {!isLoading && !error && sales.length > 0 && (
        <div className="space-y-2.5">
          {sales.map((sale: LaunchpadSale, i: number) => (
            <MobileSaleCard key={sale.id} sale={sale} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
