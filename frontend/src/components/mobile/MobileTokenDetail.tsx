'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { t } from '@/i18n';
import { formatUSD, shortenAddress, getExplorerAddressUrl } from '@/lib/formatters';
import { PriceChart } from '@/components/charts/PriceChart';
import { AITokenAnalysis } from '@/components/ai/AITokenAnalysis';
import { Skeleton } from '@/components/common/Skeleton';
import { TokenIcon } from '@/components/common/TokenIcon';

interface MobileTokenDetailProps {
  address: string;
}

export function MobileTokenDetail({ address }: MobileTokenDetailProps) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['token', address],
    queryFn: () => api.getToken(address),
  });

  const token = data?.token;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-3 pt-3 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Link
          href="/app/swap"
          className="flex items-center gap-2 mb-3 text-sm font-semibold min-h-[44px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.swap')}
        </Link>

        {isLoading ? (
          <div className="space-y-2 mb-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-60" />
          </div>
        ) : token ? (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <TokenIcon symbol={token.symbol} logoURI={token.icon_url} size="lg" />
              <div>
                <h1
                  className="text-xl font-bold font-[var(--font-heading)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {token.name}
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {token.symbol}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span
                className="rounded-lg px-2.5 py-1 text-xs font-[var(--font-mono)]"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {shortenAddress(address)}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('tokens.not_found')}
          </p>
        )}

        {token && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('tokens.price')}
              </p>
              <p
                className="mt-1 text-2xl font-bold font-[var(--font-mono)]"
                style={{
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatUSD(token.price_usd || 0)}
              </p>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="h-[280px]">
                <PriceChart />
              </div>
            </div>

            <AITokenAnalysis tokenAddress={address} />

            <div
              className="rounded-2xl p-4"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                {t('tokens.quick_actions')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/app/swap?tokenOut=${address}`}
                  className="flex items-center justify-center py-3 rounded-xl text-sm font-bold min-h-[44px]"
                  style={{
                    background: 'var(--gradient-primary)',
                    color: '#fff',
                    boxShadow: 'var(--glow-gold)',
                  }}
                >
                  {t('tokens.buy', { symbol: token.symbol })}
                </Link>
                <Link
                  href={`/app/swap?tokenIn=${address}`}
                  className="flex items-center justify-center py-3 rounded-xl text-sm font-bold min-h-[44px]"
                  style={{
                    background: 'var(--bg-surface-2)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {t('tokens.sell', { symbol: token.symbol })}
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
