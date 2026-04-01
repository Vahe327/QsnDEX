'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/formatters';
import type { LaunchpadSale, UserContribution } from '@/hooks/useLaunchpad';

interface ContributeFormProps {
  sale: LaunchpadSale;
  contribution?: UserContribution;
  contribute: (amountEth: string) => Promise<string | undefined>;
  isContributing: boolean;
  isContributeSuccess: boolean;
  invalidateAll: () => void;
}

export function ContributeForm({
  sale,
  contribution,
  contribute,
  isContributing,
  isContributeSuccess,
  invalidateAll,
}: ContributeFormProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (isContributeSuccess) {
      setAmount('');
      invalidateAll();
    }
  }, [isContributeSuccess, invalidateAll]);

  const balanceFormatted = ethBalance ? formatNumber(Number(formatEther(ethBalance.value))) : '0.00';
  const maxPerWallet = Number(sale.max_per_wallet);
  const hasWalletLimit = maxPerWallet > 0;
  const alreadyContributed = contribution ? Number(contribution.contributed) : 0;
  const remaining = hasWalletLimit ? Math.max(maxPerWallet - alreadyContributed, 0) : Infinity;

  const expectedTokens = useMemo(() => {
    if (!amount || Number(amount) <= 0 || Number(sale.price) <= 0) return '0';
    const tokenAmount = Number(amount) / Number(sale.price);
    return formatNumber(tokenAmount);
  }, [amount, sale.price]);

  const handleMax = () => {
    const balVal = ethBalance ? Number(formatEther(ethBalance.value)) : 0;
    const max = Math.min(balVal, remaining);
    setAmount(max > 0 ? max.toString() : '0');
  };

  const handleContribute = async () => {
    if (!amount || Number(amount) <= 0) return;
    await contribute(amount);
  };

  const inputAmount = Number(amount || '0');
  const exceedsMax = inputAmount > remaining;
  const exceedsBalance = ethBalance ? parseEther(amount || '0') > ethBalance.value : false;
  const isActive = sale.status === 'active';

  const getButtonLabel = () => {
    if (!address) return t('common.connect_wallet');
    if (!isActive) return t('launchpad.sale_not_active');
    if (isContributing) return t('launchpad.contributing');
    if (!amount || inputAmount <= 0) return t('launchpad.enter_amount');
    if (exceedsBalance) return t('launchpad.insufficient_eth');
    if (exceedsMax) return t('launchpad.exceeds_max');
    return t('launchpad.contribute');
  };

  const isDisabled = isContributing || !amount || inputAmount <= 0 || exceedsBalance || exceedsMax || !address || !isActive;

  return (
    <div>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {t('launchpad.contribute')}
      </h3>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('launchpad.amount_eth')}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {t('common.balance')}: {balanceFormatted} ETH
          </span>
        </div>
        <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              if (val.split('.').length <= 2) setAmount(val);
            }}
            className="flex-1 bg-transparent outline-none text-lg font-medium"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            ETH
          </span>
          <button
            onClick={handleMax}
            className="px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            style={{
              background: 'rgba(240, 180, 41, 0.1)',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(240, 180, 41, 0.2)',
            }}
          >
            {t('common.max')}
          </button>
        </div>
      </div>

      {hasWalletLimit && (
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: 'var(--text-tertiary)' }}>{t('launchpad.max_per_wallet')}</span>
          <span
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            }}
          >
            {formatNumber(maxPerWallet)} ETH
          </span>
        </div>
      )}

      {alreadyContributed > 0 && (
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: 'var(--text-tertiary)' }}>{t('launchpad.your_contribution')}</span>
          <span
            style={{
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            }}
          >
            {formatNumber(alreadyContributed)} ETH
          </span>
        </div>
      )}

      {hasWalletLimit && (
        <div className="flex items-center justify-between text-sm mb-4">
          <span style={{ color: 'var(--text-tertiary)' }}>{t('launchpad.remaining_allocation')}</span>
          <span
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            }}
          >
            {formatNumber(remaining)} ETH
          </span>
        </div>
      )}

      {inputAmount > 0 && (
        <div
          className="rounded-xl p-3 mb-4"
          style={{ background: 'rgba(240, 180, 41, 0.05)', border: '1px solid rgba(240, 180, 41, 0.15)' }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{t('launchpad.expected_tokens')}</span>
            <span
              className="font-semibold"
              style={{
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {expectedTokens} {sale.token_symbol}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleContribute}
        disabled={isDisabled}
        className="btn-primary w-full py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isContributing && <Loader2 className="w-4 h-4 animate-spin" />}
        {getButtonLabel()}
      </button>
    </div>
  );
}
