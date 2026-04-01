'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { type Address, parseEther } from 'viem';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/formatters';
import { formatTokenAmount } from '@/lib/formatters';
import { QSN_TOKEN_ABI } from '@/config/contracts';
import type { StakingUser } from '@/hooks/useQsnStaking';

interface StakeCardProps {
  userInfo?: StakingUser;
  isLoadingUser: boolean;
  contracts: { qsnToken: string; stakeVault: string };
  approveQsn: (amount: bigint) => Promise<string | undefined>;
  stake: (amount: string) => Promise<string | undefined>;
  unstake: (amount: string) => Promise<string | undefined>;
  isApproving: boolean;
  isStaking: boolean;
  isUnstaking: boolean;
  invalidateAll: () => void;
  isStakeSuccess: boolean;
  isUnstakeSuccess: boolean;
  isApproveSuccess: boolean;
}

type TabMode = 'stake' | 'unstake';

export function StakeCard({
  userInfo,
  isLoadingUser,
  contracts,
  approveQsn,
  stake,
  unstake,
  isApproving,
  isStaking,
  isUnstaking,
  invalidateAll,
  isStakeSuccess,
  isUnstakeSuccess,
  isApproveSuccess,
}: StakeCardProps) {
  const { address } = useAccount();
  const [mode, setMode] = useState<TabMode>('stake');
  const [amount, setAmount] = useState('');

  const { data: qsnBalance } = useReadContract({
    address: contracts.qsnToken as Address,
    abi: QSN_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts.qsnToken },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.qsnToken as Address,
    abi: QSN_TOKEN_ABI,
    functionName: 'allowance',
    args: address && contracts.stakeVault ? [address, contracts.stakeVault as Address] : undefined,
    query: { enabled: !!address && !!contracts.qsnToken && !!contracts.stakeVault },
  });

  useEffect(() => {
    if (isStakeSuccess || isUnstakeSuccess) {
      setAmount('');
      invalidateAll();
    }
  }, [isStakeSuccess, isUnstakeSuccess, invalidateAll]);

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  const balance = qsnBalance as bigint | undefined;
  const balanceFormatted = balance ? formatTokenAmount(balance, 18) : '0.000000';
  const stakedFormatted = userInfo ? formatNumber(Number(userInfo.staked_amount)) : '0.00';
  const sharePct = userInfo?.share_pct ?? 0;

  const parsedAmount = amount ? parseEther(amount) : 0n;
  const currentAllowance = (allowance as bigint) ?? 0n;
  const needsApproval = mode === 'stake' && parsedAmount > 0n && currentAllowance < parsedAmount;

  const maxBalance = mode === 'stake' ? balanceFormatted : stakedFormatted;

  const handleMax = () => {
    const cleanMax = maxBalance.replace(/,/g, '');
    setAmount(cleanMax);
  };

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (mode === 'stake') {
      if (needsApproval) {
        await approveQsn(parsedAmount);
      } else {
        await stake(amount);
      }
    } else {
      await unstake(amount);
    }
  };

  const isPending = isApproving || isStaking || isUnstaking;

  const getButtonLabel = () => {
    if (!address) return t('common.connect_wallet');
    if (isApproving) return t('staking.approving');
    if (isStaking) return t('staking.staking');
    if (isUnstaking) return t('staking.unstaking');
    if (!amount || parseFloat(amount) <= 0) return t('staking.enter_amount');
    if (mode === 'stake' && needsApproval) return t('staking.approve_qsn');
    if (mode === 'stake') return t('staking.stake');
    return t('staking.unstake');
  };

  const isDisabled = isPending || !amount || parseFloat(amount) <= 0 || !address;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="card p-6"
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {t('staking.manage_stake')}
      </h2>

      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: 'var(--bg-sunken)' }}
      >
        <button
          onClick={() => { setMode('stake'); setAmount(''); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: mode === 'stake' ? 'var(--bg-surface)' : 'transparent',
            color: mode === 'stake' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            boxShadow: mode === 'stake' ? 'var(--shadow-card)' : 'none',
          }}
        >
          <Lock className="w-4 h-4" />
          {t('staking.stake')}
        </button>
        <button
          onClick={() => { setMode('unstake'); setAmount(''); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: mode === 'unstake' ? 'var(--bg-surface)' : 'transparent',
            color: mode === 'unstake' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            boxShadow: mode === 'unstake' ? 'var(--shadow-card)' : 'none',
          }}
        >
          <Unlock className="w-4 h-4" />
          {t('staking.unstake')}
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('staking.amount')}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {t('common.balance')}: {maxBalance} QSN
          </span>
        </div>
        <div
          className="input-sunken flex items-center gap-2 p-3 rounded-xl"
        >
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

      {address && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{t('staking.your_staked')}</span>
            <span
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {isLoadingUser ? '...' : `${stakedFormatted} QSN`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{t('staking.your_share')}</span>
            <span
              style={{
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {isLoadingUser ? '...' : `${sharePct.toFixed(4)}%`}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleAction}
        disabled={isDisabled}
        className="btn-primary w-full py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {getButtonLabel()}
      </button>
    </motion.div>
  );
}
