'use client';

import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Wallet } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import type { TokenInfo } from '@/config/tokens';

interface TokenInputProps {
  label: string;
  amount: string;
  onAmountChange: (value: string) => void;
  token: TokenInfo | null;
  onTokenSelect: () => void;
  balance: string;
  balanceRaw: bigint;
  usdValue?: string;
  readOnly?: boolean;
  isLoading?: boolean;
}

export function TokenInput({
  label,
  amount,
  onAmountChange,
  token,
  onTokenSelect,
  balance,
  balanceRaw,
  usdValue,
  readOnly = false,
  isLoading = false,
}: TokenInputProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        onAmountChange(value);
      }
    },
    [onAmountChange]
  );

  const handleMax = useCallback(() => {
    if (balance && balance !== '0.000000') {
      const trimmed = balance.replace(/0+$/, '').replace(/\.$/, '');
      onAmountChange(trimmed);
    }
  }, [balance, onAmountChange]);

  const hasBalance = useMemo(() => balanceRaw > 0n, [balanceRaw]);

  return (
    <div
      className={cn(
        'input-sunken p-4 transition-all duration-300'
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <Wallet className="w-3 h-3" />
          <span className="font-[var(--font-mono)] tabular-nums">{balance || '0.00'}</span>
          {hasBalance && !readOnly && (
            <button
              onClick={handleMax}
              className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-[rgba(6,182,212,0.08)] hover:bg-[rgba(6,182,212,0.15)] rounded-md transition-all duration-200"
            >
              {t('common.max')}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-[34px] flex items-center">
              <div className="skeleton w-32 h-7 rounded-lg" />
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={readOnly ? formatNumber(amount) : amount}
              onChange={handleInputChange}
              readOnly={readOnly}
              className="w-full bg-transparent text-[28px] font-semibold font-[var(--font-mono)] tabular-nums text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none truncate leading-tight"
            />
          )}
          {usdValue && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-[var(--font-mono)]">
              ~${usdValue}
            </p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onTokenSelect}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-2xl shrink-0 transition-all duration-200',
            'bg-[rgba(15,23,42,0.6)] border border-[rgba(56,189,248,0.08)]',
            'hover:border-[rgba(6,182,212,0.25)] hover:shadow-[0_0_16px_rgba(6,182,212,0.08)]',
            'hover:bg-[rgba(15,23,42,0.8)]'
          )}
        >
          {token ? (
            <>
              <TokenIcon address={token.address} symbol={token.symbol} logoURI={token.logoURI} size="sm" />
              <span className="font-bold text-[var(--color-text)] text-sm">{token.symbol}</span>
            </>
          ) : (
            <span className="font-semibold text-[var(--color-primary)] text-sm whitespace-nowrap">
              {t('swap.selectToken')}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        </motion.button>
      </div>
    </div>
  );
}
