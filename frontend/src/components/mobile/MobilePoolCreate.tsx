'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { t } from '@/i18n';
import { CreatePool } from '@/components/pools/CreatePool';

export function MobilePoolCreate() {
  const router = useRouter();

  return (
    <div className="px-3 pt-3 pb-4">
      <button
        onClick={() => router.push('/app/pools')}
        className="flex items-center gap-2 mb-3 text-sm font-semibold min-h-[44px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('pools.title')}
      </button>

      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))' }}
        >
          <Plus className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
          {t('pools.create_pool')}
        </h1>
      </div>

      <div className="[&_.card]:!rounded-2xl [&_.card]:!border-[var(--border-subtle)] [&_button]:min-h-[44px]">
        <CreatePool />
      </div>
    </div>
  );
}
