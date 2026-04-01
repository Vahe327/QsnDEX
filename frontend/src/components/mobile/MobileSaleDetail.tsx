'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Rocket } from 'lucide-react';
import { t } from '@/i18n';
import { SaleDetail } from '@/components/launchpad/SaleDetail';

interface MobileSaleDetailProps {
  id: string;
}

export function MobileSaleDetail({ id }: MobileSaleDetailProps) {
  const router = useRouter();

  return (
    <div className="px-3 pt-3 pb-4">
      <button
        onClick={() => router.push('/app/launchpad')}
        className="flex items-center gap-2 mb-3 text-sm font-semibold min-h-[44px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('launchpad.back_to_list')}
      </button>

      <div className="[&_button]:min-h-[44px] [&_.card]:!rounded-2xl [&_.card]:!border-[var(--border-subtle)]">
        <SaleDetail saleId={id} />
      </div>
    </div>
  );
}
