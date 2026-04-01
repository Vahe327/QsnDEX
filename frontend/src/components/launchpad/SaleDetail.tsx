'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Loader2, Users, ExternalLink, Globe, MessageCircle, Coins, Droplets } from 'lucide-react';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/formatters';
import { shortenAddress } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import { useLaunchpadSale } from '@/hooks/useLaunchpad';
import { SaleStatusBadge } from './SaleStatusBadge';
import { SaleProgress } from './SaleProgress';
import { SaleCountdown } from './SaleCountdown';
import { ContributeForm } from './ContributeForm';
import { ClaimTokens } from './ClaimTokens';

interface SaleDetailProps {
  saleId: string;
}

export function SaleDetail({ saleId }: SaleDetailProps) {
  const { explorerUrl } = useChain();
  const {
    sale,
    contribution,
    isLoadingSale,
    isLoadingContrib,
    saleError,
    contribute,
    claimTokens,
    refund,
    invalidateAll,
    isContributing,
    isContributeSuccess,
    isClaimingTokens,
    isClaimSuccess,
    isRefunding,
    isRefundSuccess,
    contributeHash,
    claimHash,
    refundHash,
    resetContribute,
    resetClaim,
    resetRefund,
    contracts,
  } = useLaunchpadSale(saleId);

  if (isLoadingSale) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (saleError || !sale) {
    return (
      <div className="card p-8 text-center">
        <p style={{ color: 'var(--text-secondary)' }}>{t('launchpad.sale_not_found')}</p>
        <Link
          href="/app/launchpad"
          className="inline-flex items-center gap-1 mt-4 text-sm transition-colors"
          style={{ color: 'var(--accent-primary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> {t('launchpad.back_to_list')}
        </Link>
      </div>
    );
  }

  const countdownTarget = sale.status === 'upcoming' ? sale.start_time : sale.end_time;
  const countdownLabel =
    sale.status === 'upcoming'
      ? t('launchpad.starts_in')
      : sale.status === 'active'
        ? t('launchpad.ends_in')
        : '';

  const priceEth = parseFloat(sale.price);
  const liquidityPctDisplay = sale.liquidity_pct > 100 ? sale.liquidity_pct / 100 : sale.liquidity_pct;
  const lockDays = sale.lock_duration > 0 ? sale.lock_duration : Math.floor(sale.liquidity_pct > 0 ? 30 : 0);
  const canRefund = sale.cancelled && contribution && Number(contribution.contributed) > 0 && !contribution.claimed;

  return (
    <div>
      <Link
        href="/app/launchpad"
        className="inline-flex items-center gap-1 mb-5 text-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" /> {t('launchpad.back_to_list')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-3 card p-6"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start gap-3">
              {sale.logo_url && (
                <img
                  src={sale.logo_url}
                  alt={sale.sale_name || sale.token_symbol}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {sale.sale_name || sale.token_name || sale.token_symbol}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {sale.token_symbol}{sale.token_name && sale.sale_name ? ` · ${sale.token_name}` : ''}
                  </span>
                  <a
                    href={`${explorerUrl}/address/${sale.token_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm transition-colors"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {shortenAddress(sale.token_address)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {sale.description && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {sale.description}
                  </p>
                )}
                {(sale.website_url || sale.social_url) && (
                  <div className="flex items-center gap-3 mt-2">
                    {sale.website_url && (
                      <a href={sale.website_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs transition-colors hover:text-[var(--accent-primary)]"
                        style={{ color: 'var(--text-tertiary)' }}>
                        <Globe className="w-3.5 h-3.5" /> {t('launchpad.website_label')}
                      </a>
                    )}
                    {sale.social_url && (
                      <a href={sale.social_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs transition-colors hover:text-[var(--accent-primary)]"
                        style={{ color: 'var(--text-tertiary)' }}>
                        <MessageCircle className="w-3.5 h-3.5" /> {t('launchpad.social_label')}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <SaleStatusBadge status={sale.status} />
          </div>

          <div className="mb-6">
            <SaleProgress
              raised={sale.total_raised}
              softCap={sale.soft_cap}
              hardCap={sale.hard_cap}
              symbol="ETH"
            />
          </div>

          {sale.status !== 'ended' && (
            <div className="mb-6">
              <SaleCountdown targetTimestamp={countdownTarget} label={countdownLabel} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
                {t('launchpad.token_price')}
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {priceEth > 0 ? `${formatNumber(priceEth)} ETH` : '-'}
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
                {t('launchpad.participants_label')}
              </span>
              <span className="text-base font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                <Users className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                {sale.participants}
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Coins className="w-3 h-3" /> {t('launchpad.tokens_for_sale')}
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatNumber(parseFloat(sale.tokens_for_sale))} {sale.token_symbol}
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Droplets className="w-3 h-3" /> {t('launchpad.tokens_for_liquidity')}
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatNumber(parseFloat(sale.tokens_for_liquidity))} {sale.token_symbol}
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
                {t('launchpad.total_raised_label')}
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatNumber(Number(sale.total_raised))} ETH
              </span>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
                {t('launchpad.liquidity_lock')}
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {liquidityPctDisplay}% · {sale.lock_duration} {t('launchpad.lock_days_unit') || 'd'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-2 card p-6 h-fit"
        >
          <ContributeForm
            sale={sale}
            contribution={contribution}
            contribute={contribute}
            isContributing={isContributing}
            isContributeSuccess={isContributeSuccess}
            invalidateAll={invalidateAll}
          />

          {contributeHash && isContributeSuccess && (
            <a
              href={`${explorerUrl}/tx/${contributeHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-sm mt-3 transition-colors"
              style={{ color: 'var(--accent-primary)' }}
            >
              {t('common.view_explorer')} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <ClaimTokens
            sale={sale}
            contribution={contribution}
            claimTokens={claimTokens}
            isClaimingTokens={isClaimingTokens}
            isClaimSuccess={isClaimSuccess}
            claimHash={claimHash}
            invalidateAll={invalidateAll}
          />

          {canRefund && (
            <div className="mt-4">
              <button
                onClick={refund}
                disabled={isRefunding}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {isRefunding && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRefunding ? t('launchpad.refunding') : t('launchpad.refund')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
