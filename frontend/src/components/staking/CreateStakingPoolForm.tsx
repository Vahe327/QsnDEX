'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  ArrowRight,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { type Address, parseUnits, formatUnits } from 'viem';
import { useRouter } from 'next/navigation';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/formatters';
import { useChain } from '@/hooks/useChain';
import { useCreateStakingPool } from '@/hooks/useCreateStakingPool';
import { ERC20_ABI } from '@/config/contracts';

type Step = 0 | 1 | 2;

interface TokenSelection {
  address: string;
  symbol: string;
  decimals: number;
}

export function CreateStakingPoolForm() {
  const { address: wallet } = useAccount();
  const { explorerUrl } = useChain();
  const router = useRouter();

  const {
    factoryAddress,
    creationFee,
    platformFeeBps,
    isLoadingFee,
    approveRewardToken,
    createPool,
    invalidateAll,
    isApproving,
    isApproveSuccess,
    isCreating,
    isCreateSuccess,
    createPoolHash,
  } = useCreateStakingPool();

  const [step, setStep] = useState<Step>(0);
  const [stakeToken, setStakeToken] = useState<TokenSelection | null>(null);
  const [rewardToken, setRewardToken] = useState<TokenSelection | null>(null);
  const [rewardAmount, setRewardAmount] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [minStake, setMinStake] = useState('');
  const [maxStakePerUser, setMaxStakePerUser] = useState('');

  const [stakeTokenInput, setStakeTokenInput] = useState('');
  const [rewardTokenInput, setRewardTokenInput] = useState('');

  const { data: stakeSymbol } = useReadContract({
    address: stakeTokenInput.length === 42 ? (stakeTokenInput as Address) : undefined,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: stakeTokenInput.length === 42 },
  });

  const { data: stakeDecimals } = useReadContract({
    address: stakeTokenInput.length === 42 ? (stakeTokenInput as Address) : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: stakeTokenInput.length === 42 },
  });

  const { data: rewardSymbol } = useReadContract({
    address: rewardTokenInput.length === 42 ? (rewardTokenInput as Address) : undefined,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: rewardTokenInput.length === 42 },
  });

  const { data: rewardDecimals } = useReadContract({
    address: rewardTokenInput.length === 42 ? (rewardTokenInput as Address) : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: rewardTokenInput.length === 42 },
  });

  const { data: rewardBalance } = useReadContract({
    address: rewardToken?.address ? (rewardToken.address as Address) : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: wallet ? [wallet] : undefined,
    query: { enabled: !!wallet && !!rewardToken?.address },
  });

  const { data: rewardAllowance, refetch: refetchAllowance } = useReadContract({
    address: rewardToken?.address ? (rewardToken.address as Address) : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: wallet && factoryAddress ? [wallet, factoryAddress as Address] : undefined,
    query: { enabled: !!wallet && !!rewardToken?.address && !!factoryAddress },
  });

  useEffect(() => {
    if (stakeSymbol && stakeDecimals !== undefined && stakeTokenInput.length === 42) {
      setStakeToken({
        address: stakeTokenInput,
        symbol: stakeSymbol as string,
        decimals: Number(stakeDecimals),
      });
    }
  }, [stakeSymbol, stakeDecimals, stakeTokenInput]);

  useEffect(() => {
    if (rewardSymbol && rewardDecimals !== undefined && rewardTokenInput.length === 42) {
      setRewardToken({
        address: rewardTokenInput,
        symbol: rewardSymbol as string,
        decimals: Number(rewardDecimals),
      });
    }
  }, [rewardSymbol, rewardDecimals, rewardTokenInput]);

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isCreateSuccess) {
      invalidateAll();
    }
  }, [isCreateSuccess, invalidateAll]);

  const parsedReward = rewardToken && rewardAmount
    ? parseUnits(rewardAmount, rewardToken.decimals)
    : 0n;

  const currentAllowance = (rewardAllowance as bigint) ?? 0n;
  const needsApproval = parsedReward > 0n && currentAllowance < parsedReward;

  const canGoToStep1 = stakeToken !== null && rewardToken !== null;
  const canGoToStep2 = canGoToStep1 && rewardAmount.length > 0 && parseFloat(rewardAmount) > 0 && durationDays.length > 0 && parseInt(durationDays) > 0;

  const handleApproveAndCreate = useCallback(async () => {
    if (!rewardToken) return;
    if (needsApproval) {
      await approveRewardToken(rewardToken.address, parsedReward);
    } else {
      if (!stakeToken) return;
      const minStakeWei = minStake && stakeToken ? parseUnits(minStake, stakeToken.decimals) : 0n;
      const maxStakeWei = maxStakePerUser && stakeToken ? parseUnits(maxStakePerUser, stakeToken.decimals) : 0n;
      await createPool(
        stakeToken.address,
        rewardToken.address,
        rewardAmount,
        rewardToken.decimals,
        parseInt(durationDays),
        minStakeWei,
        maxStakeWei
      );
    }
  }, [needsApproval, approveRewardToken, createPool, stakeToken, rewardToken, rewardAmount, durationDays, parsedReward]);

  const creationFeeFormatted = creationFee !== '0' ? formatNumber(Number(formatUnits(BigInt(creationFee), 18))) : '0';
  const platformFeePct = platformFeeBps / 100;

  const steps = [
    t('staking_pools.step_tokens'),
    t('staking_pools.step_params'),
    t('staking_pools.step_review'),
  ];

  const rewardBalFormatted = rewardBalance && rewardToken
    ? formatNumber(Number(formatUnits(rewardBalance as bigint, rewardToken.decimals)))
    : '0';

  const isPending = isApproving || isCreating;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold gradient-text mb-1" style={{ display: 'inline-block' }}>
          {t('staking_pools.create_pool_title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
          {t('staking_pools.create_pool_subtitle')}
        </p>
      </motion.div>

      <div className="flex items-center justify-center gap-3 mb-8">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: i <= step
                    ? 'linear-gradient(135deg, rgba(240, 180, 41, 0.9), rgba(240, 180, 41, 0.6))'
                    : 'var(--bg-sunken)',
                  color: i <= step ? '#000' : 'var(--text-tertiary)',
                  border: i <= step ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: i <= step ? '0 0 12px rgba(240, 180, 41, 0.4)' : 'none',
                }}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className="text-xs mt-1 whitespace-nowrap"
                style={{
                  color: i <= step ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  textShadow: i <= step ? '0 0 8px rgba(240, 180, 41, 0.3)' : 'none',
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-12 h-0.5 rounded-full mt-[-16px]"
                style={{
                  background: i < step ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {isCreateSuccess && createPoolHash && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
            {t('staking_pools.pool_created')}
          </h2>
          <a
            href={`${explorerUrl}/tx/${createPoolHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm mb-4"
            style={{ color: 'var(--accent-primary)' }}
          >
            {t('staking_pools.view_on_explorer')} <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div>
            <button
              onClick={() => router.push('/app/staking')}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              {t('staking_pools.back_to_pools')}
            </button>
          </div>
        </motion.div>
      )}

      {!isCreateSuccess && step === 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="card p-6"
        >
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.select_stake_token')}
              </label>
              <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
                <Coins className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <input
                  type="text"
                  placeholder="0x..."
                  value={stakeTokenInput}
                  onChange={(e) => setStakeTokenInput(e.target.value.trim())}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
                {stakeToken && (
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{
                      background: 'rgba(240, 180, 41, 0.1)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(240, 180, 41, 0.2)',
                    }}
                  >
                    {stakeToken.symbol}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.select_reward_token')}
              </label>
              <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
                <Coins className="w-5 h-5 shrink-0" style={{ color: '#818cf8' }} />
                <input
                  type="text"
                  placeholder="0x..."
                  value={rewardTokenInput}
                  onChange={(e) => setRewardTokenInput(e.target.value.trim())}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
                {rewardToken && (
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    {rewardToken.symbol}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(1)}
              disabled={!canGoToStep1}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('staking_pools.next_step')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {!isCreateSuccess && step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="card p-6"
        >
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.reward_amount')} ({rewardToken?.symbol ?? '?'})
              </label>
              <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={t('staking_pools.reward_amount_placeholder')}
                  value={rewardAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    if (val.split('.').length <= 2) setRewardAmount(val);
                  }}
                  className="flex-1 bg-transparent outline-none text-lg font-medium"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <span className="text-xs mt-1 block" style={{ color: 'var(--text-tertiary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('common.balance')}: {rewardBalFormatted} {rewardToken?.symbol ?? ''}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.duration_days')}
              </label>
              <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
                <Clock className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('staking_pools.duration_placeholder')}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 bg-transparent outline-none text-lg font-medium"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('staking_pools.min_stake')} ({stakeToken?.symbol ?? '?'})
                </label>
                <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={t('staking_pools.optional_zero')}
                    value={minStake}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      if (val.split('.').length <= 2) setMinStake(val);
                    }}
                    className="flex-1 bg-transparent outline-none text-sm font-medium"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('staking_pools.max_stake_per_user')} ({stakeToken?.symbol ?? '?'})
                </label>
                <div className="input-sunken flex items-center gap-2 p-3 rounded-xl">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={t('staking_pools.optional_zero')}
                    value={maxStakePerUser}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      if (val.split('.').length <= 2) setMaxStakePerUser(val);
                    }}
                    className="flex-1 bg-transparent outline-none text-sm font-medium"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                  {t('staking_pools.creation_fee')}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)',
                    textShadow: '0 0 8px rgba(240, 180, 41, 0.3)',
                  }}
                >
                  {isLoadingFee ? '...' : `${creationFeeFormatted} ETH`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                  {t('staking_pools.platform_fee')}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    textShadow: '0 0 6px rgba(0,0,0,0.3)',
                  }}
                >
                  {isLoadingFee ? '...' : `${platformFeePct}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(0)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: 'var(--bg-sunken)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('staking_pools.prev_step')}
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('staking_pools.next_step')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {!isCreateSuccess && step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
            {t('staking_pools.review_summary')}
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.stake_token')}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
                {stakeToken?.symbol ?? '?'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.reward_token')}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
                {rewardToken?.symbol ?? '?'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.reward_amount')}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', textShadow: '0 0 8px rgba(240, 180, 41, 0.3)' }}>
                {rewardAmount} {rewardToken?.symbol ?? ''}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.duration_days')}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', textShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
                {durationDays}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)', textShadow: '0 0 4px rgba(0,0,0,0.2)' }}>
                {t('staking_pools.creation_fee')}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', textShadow: '0 0 8px rgba(240, 180, 41, 0.3)' }}>
                {creationFeeFormatted} ETH
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: 'var(--bg-sunken)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('staking_pools.prev_step')}
            </button>
            {!wallet ? (
              <button
                disabled
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
              >
                {t('staking_pools.connect_wallet')}
              </button>
            ) : (
              <button
                onClick={handleApproveAndCreate}
                disabled={isPending}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isApproving
                  ? t('staking_pools.approving')
                  : isCreating
                    ? t('staking_pools.creating')
                    : needsApproval
                      ? t('staking_pools.approve_token', { symbol: rewardToken?.symbol ?? '' })
                      : t('staking_pools.approve_and_create')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
