'use client';

import { cn } from '@/lib/utils';

type SkeletonVariant = 'text' | 'circle' | 'card' | 'row';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

function getVariantClasses(variant: SkeletonVariant): string {
  switch (variant) {
    case 'circle':
      return 'rounded-full';
    case 'card':
      return 'rounded-[20px]';
    case 'row':
      return 'rounded-xl';
    case 'text':
    default:
      return 'rounded-md';
  }
}

function getDefaultSize(variant: SkeletonVariant): { width?: string; height: string } {
  switch (variant) {
    case 'circle':
      return { width: '40px', height: '40px' };
    case 'card':
      return { width: '100%', height: '160px' };
    case 'row':
      return { width: '100%', height: '56px' };
    case 'text':
    default:
      return { width: '100%', height: '16px' };
  }
}

function SkeletonItem({ variant = 'text', width, height, className }: Omit<SkeletonProps, 'count'>) {
  const defaults = getDefaultSize(variant);
  const w = width ?? defaults.width;
  const h = height ?? defaults.height;

  return (
    <div
      className={cn('skeleton', getVariantClasses(variant), className)}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
      }}
    />
  );
}

export function Skeleton({ variant = 'text', width, height, className, count = 1 }: SkeletonProps) {
  if (count <= 1) {
    return <SkeletonItem variant={variant} width={width} height={height} className={className} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} variant={variant} width={width} height={height} className={className} />
      ))}
    </div>
  );
}
