'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChain } from '@/hooks/useChain';
import { t } from '@/i18n';

interface ExplorerLinkProps {
  hash?: string;
  address?: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function ExplorerLink({
  hash,
  address,
  label,
  className,
  showIcon = true,
}: ExplorerLinkProps) {
  const { explorerUrl } = useChain();

  if (!hash && !address) return null;

  const path = hash ? `/tx/${hash}` : `/address/${address}`;
  const href = `${explorerUrl}${path}`;

  const displayLabel =
    label ??
    (hash
      ? `${hash.slice(0, 6)}...${hash.slice(-4)}`
      : `${address!.slice(0, 6)}...${address!.slice(-4)}`);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm transition-colors',
        'text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]',
        className
      )}
    >
      <span>{displayLabel}</span>
      {showIcon && <ExternalLink className="w-3.5 h-3.5" />}
    </a>
  );
}
