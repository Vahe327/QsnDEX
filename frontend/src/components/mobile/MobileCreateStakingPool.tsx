'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins } from 'lucide-react';
import { t } from '@/i18n';
import { CreateStakingPoolForm } from '@/components/staking/CreateStakingPoolForm';

export function MobileCreateStakingPool() {
  const router = useRouter();

  return (
    <div className="px-3 pt-3 pb-4">
      <button
        onClick={() => router.push('/app/staking')}
        className="flex items-center gap-2 mb-3 text-sm font-semibold min-h-[44px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('staking_pools.back_to_pools')}
      </button>

      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))' }}
        >
          <Coins className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
          {t('staking_pools.create_pool_title')}
        </h1>
      </div>

      <div className="[&_.card]:!rounded-2xl [&_.card]:!border-[var(--border-subtle)] [&_button]:min-h-[44px]">
        <CreateStakingPoolForm />
      </div>
    </div>
  );
}
