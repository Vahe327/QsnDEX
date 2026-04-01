'use client';

import { use, useState } from 'react';
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
import { MobileTokenDetail } from '@/components/mobile/MobileTokenDetail';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function TokenDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const isMobile = useIsMobile();
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

  if (isMobile) return <MobileTokenDetail address={address} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6 flex items-start gap-4">
          <Link
            href="/app/swap"
            className="mt-1 rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={20} />
          </Link>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton variant="text" className="h-8 w-40" />
              <Skeleton variant="text" className="h-5 w-60" />
            </div>
          ) : token ? (
            <div>
              <div className="flex items-center gap-3">
                <TokenIcon symbol={token.symbol} logoURI={token.icon_url} size="lg" />
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {token.name}
                  </h1>
                  <p className="text-[var(--text-secondary)]">{token.symbol}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-lg bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {shortenAddress(address)}
                </span>
                <button onClick={handleCopy} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <a
                  href={getExplorerAddressUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)]">{t('tokens.not_found')}</p>
          )}
        </div>

        {token && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-4 sm:p-6">
                <p className="text-sm text-[var(--text-secondary)]">{t('tokens.price')}</p>
                <p className="mt-1 text-3xl font-bold gradient-text" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatUSD(token.price_usd || 0)}
                </p>
              </div>

              <div className="card p-4 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {t('charts.price_chart')}
                </h2>
                <div className="h-[320px] sm:h-[400px]">
                  <PriceChart />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AITokenAnalysis tokenAddress={address} />

              <div className="card p-4 sm:p-6">
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">{t('tokens.quick_actions')}</h3>
                <div className="space-y-2">
                  <Link
                    href={`/app/swap?tokenOut=${address}`}
                    className="btn-primary !h-10 !text-sm"
                  >
                    {t('tokens.buy', { symbol: token.symbol })}
                  </Link>
                  <Link
                    href={`/app/swap?tokenIn=${address}`}
                    className="btn-secondary w-full flex items-center justify-center !h-10 !text-sm"
                  >
                    {t('tokens.sell', { symbol: token.symbol })}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
