'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins } from 'lucide-react';
import { t } from '@/i18n';
import { StakingPoolDetail } from '@/components/staking/StakingPoolDetail';

interface MobileStakingDetailProps {
  address: string;
}

export function MobileStakingDetail({ address }: MobileStakingDetailProps) {
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

      <div className="[&_button]:min-h-[44px] [&_.card]:!rounded-2xl [&_.card]:!border-[var(--border-subtle)]">
        <StakingPoolDetail poolAddress={address} />
      </div>
    </div>
  );
}
