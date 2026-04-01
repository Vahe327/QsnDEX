'use client';

import { useEffect } from 'react';
import { Loader2, ExternalLink, Gift } from 'lucide-react';
import { useAccount } from 'wagmi';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import type { LaunchpadSale, UserContribution } from '@/hooks/useLaunchpad';

interface ClaimTokensProps {
  sale: LaunchpadSale;
  contribution?: UserContribution;
  claimTokens: () => Promise<string | undefined>;
  isClaimingTokens: boolean;
  isClaimSuccess: boolean;
  claimHash?: string;
  invalidateAll: () => void;
}

export function ClaimTokens({
  sale,
  contribution,
  claimTokens,
  isClaimingTokens,
  isClaimSuccess,
  claimHash,
  invalidateAll,
}: ClaimTokensProps) {
  const { address } = useAccount();
  const { explorerUrl } = useChain();

  useEffect(() => {
    if (isClaimSuccess) {
      invalidateAll();
    }
  }, [isClaimSuccess, invalidateAll]);

  const claimableTokens = contribution?.claimable_tokens ?? '0';
  const claimableNum = Number(claimableTokens);
  const alreadyClaimed = contribution?.claimed ?? false;
  const canClaim = sale.finalized && !sale.cancelled && claimableNum > 0 && !alreadyClaimed;

  if (!address || !contribution || Number(contribution.contributed) === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-5 mt-4"
      style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('launchpad.claim_tokens')}
        </h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('launchpad.claimable')}
        </span>
        <span
          className="text-base font-bold"
          style={{
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          }}
        >
          {formatNumber(claimableNum)} {sale.token_symbol}
        </span>
      </div>

      {alreadyClaimed && (
        <div
          className="rounded-lg p-2.5 mb-3 text-center text-sm"
          style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
        >
          {t('launchpad.already_claimed')}
        </div>
      )}

      {!sale.finalized && !sale.cancelled && (
        <div
          className="rounded-lg p-2.5 mb-3 text-center text-sm"
          style={{ background: 'rgba(240, 180, 41, 0.1)', color: 'var(--accent-primary)' }}
        >
          {t('launchpad.awaiting_finalization')}
        </div>
      )}

      {canClaim && (
        <button
          onClick={claimTokens}
          disabled={isClaimingTokens}
          className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClaimingTokens && <Loader2 className="w-4 h-4 animate-spin" />}
          {isClaimingTokens ? t('launchpad.claiming') : t('launchpad.claim_tokens')}
        </button>
      )}

      {claimHash && isClaimSuccess && (
        <a
          href={`${explorerUrl}/tx/${claimHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-sm mt-3 transition-colors"
          style={{ color: 'var(--accent-primary)' }}
        >
          {t('common.view_explorer')} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
