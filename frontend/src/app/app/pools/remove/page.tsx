'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { RemoveLiquidity } from '@/components/pools/RemoveLiquidity';
import { MobileRemoveLiquidity } from '@/components/mobile/MobileRemoveLiquidity';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useChain } from '@/hooks/useChain';
import { api } from '@/lib/api';
import { t } from '@/i18n';

export default function RemoveLiquidityPage() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const poolAddress = searchParams.get('pool');
  const { chainId } = useChain();

  const { data: poolData } = useQuery({
    queryKey: ['pool', chainId, poolAddress],
    queryFn: () => api.getPool(poolAddress!, chainId),
    enabled: !!poolAddress,
  });

  const pool = poolData?.pool;

  if (isMobile) return <MobileRemoveLiquidity
    poolAddress={poolAddress || undefined}
    token0Symbol={pool?.token0_symbol}
    token1Symbol={pool?.token1_symbol}
    token0Address={pool?.token0}
    token1Address={pool?.token1}
    fee={pool?.fee}
  />;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/app/pools"
            className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('pools.remove_liquidity')}
          </h1>
        </div>
        <RemoveLiquidity
          poolAddress={poolAddress || undefined}
          token0Symbol={pool?.token0_symbol}
          token1Symbol={pool?.token1_symbol}
          token0Address={pool?.token0}
          token1Address={pool?.token1}
          fee={pool?.fee}
        />
      </motion.div>
    </div>
  );
}
