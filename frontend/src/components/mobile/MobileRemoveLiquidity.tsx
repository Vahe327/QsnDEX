'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus } from 'lucide-react';
import { t } from '@/i18n';
import { RemoveLiquidity } from '@/components/pools/RemoveLiquidity';

interface MobileRemoveLiquidityProps {
  poolAddress?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  token0Address?: string;
  token1Address?: string;
  fee?: number;
}

export function MobileRemoveLiquidity({
  poolAddress,
  token0Symbol,
  token1Symbol,
  token0Address,
  token1Address,
  fee,
}: MobileRemoveLiquidityProps) {
  const router = useRouter();

  return (
    <div className="px-3 pt-3 pb-4">
      <button
        onClick={() => router.back()}
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
          <Minus className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
          {t('pools.remove_liquidity')}
        </h1>
      </div>

      <div className="[&_.card]:!rounded-2xl [&_.card]:!border-[var(--border-subtle)] [&_button]:min-h-[44px]">
        <RemoveLiquidity
          poolAddress={poolAddress}
          token0Symbol={token0Symbol}
          token1Symbol={token1Symbol}
          token0Address={token0Address}
          token1Address={token1Address}
          fee={fee}
        />
      </div>
    </div>
  );
}
