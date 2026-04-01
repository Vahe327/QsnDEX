'use client';

import { useAccount } from 'wagmi';
import { Droplets } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PositionCard } from './PositionCard';
import { Skeleton } from '@/components/common/Skeleton';
import { ConnectButton } from '@/components/common/ConnectButton';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface MyPositionsProps {
  className?: string;
}

export function MyPositions({ className }: MyPositionsProps) {
  const { isConnected } = useAccount();
  const { portfolio, isLoading } = usePortfolio();

  const positions = portfolio?.lp_positions ?? [];

  if (!isConnected) {
    return (
      <div className={cn('card p-10 flex flex-col items-center gap-4', className)}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/15 to-[var(--accent-secondary)]/15 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.08)]">
          <Droplets size={32} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] text-center">
          {t('portfolio.connect_to_view')}
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <Skeleton variant="card" count={2} height={140} />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className={cn('card p-10 flex flex-col items-center gap-3', className)}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/15 to-[var(--accent-secondary)]/15 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.08)]">
          <Droplets size={32} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] text-center">
          {t('pools.no_positions')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {positions.map((pos: any) => (
        <PositionCard key={pos.pool_address} position={pos} />
      ))}
    </div>
  );
}
