'use client';

import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';

type PairSize = 'sm' | 'md' | 'lg';

interface PoolPairIconProps {
  token0Symbol: string;
  token1Symbol: string;
  token0Logo?: string;
  token1Logo?: string;
  size?: PairSize;
  className?: string;
}

const overlapMap: Record<PairSize, string> = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
};

export function PoolPairIcon({
  token0Symbol,
  token1Symbol,
  token0Logo,
  token1Logo,
  size = 'md',
  className,
}: PoolPairIconProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <TokenIcon
        symbol={token0Symbol}
        logoURI={token0Logo}
        size={size}
        className="z-10 ring-2 ring-[var(--bg-surface)]"
      />
      <TokenIcon
        symbol={token1Symbol}
        logoURI={token1Logo}
        size={size}
        className={cn('z-0 ring-2 ring-[var(--bg-surface)]', overlapMap[size])}
      />
    </div>
  );
}
