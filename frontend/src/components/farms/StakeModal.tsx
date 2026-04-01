'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sprout, Minus, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useGasOverrides } from '@/hooks/useGasPrice';

interface Farm {
  id: string;
  pool_address: string;
  token0_symbol: string;
  token1_symbol: string;
  reward_token_symbol: string;
  apr: number;
  total_staked_usd: number;
  your_staked_usd?: number;
  your_staked_lp?: number;
}

interface StakeModalProps {
  farm: Farm;
  onClose: () => void;
}

type StakeMode = 'stake' | 'unstake';

export function StakeModal({ farm, onClose }: StakeModalProps) {
  const { address: account } = useAccount();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  const { getGasOverrides } = useGasOverrides();
  const isTxLoading = isPending || isConfirming;
  const [mode, setMode] = useState<StakeMode>('stake');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const hasStaked = (farm.your_staked_lp ?? 0) > 0;

  const handleAmountChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
      setError(null);
    }
  };

  const handleMax = () => {
    if (mode === 'stake') {
      setAmount('0');
    } else {
      setAmount(formatNumber(farm.your_staked_lp ?? 0));
    }
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!account) {
      setError(t('common.connect_wallet'));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('farms.enter_amount'));
      return;
    }

    try {
      setError(null);
      const gas = await getGasOverrides();
      await writeContractAsync({
        address: farm.pool_address as `0x${string}`,
        abi: [{
          type: 'function',
          name: mode === 'stake' ? 'stake' : 'withdraw',
          inputs: [{ name: 'amount', type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable',
        }],
        functionName: mode === 'stake' ? 'stake' : 'withdraw',
        args: [BigInt(Math.floor(parseFloat(amount) * 1e18))],
        ...gas,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  }, [account, amount, mode, farm, writeContractAsync, onClose, getGasOverrides]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'card relative w-full max-w-md overflow-hidden',
            'bg-surface',
          )}
        >
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-40" />

          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(123,97,255,0.1))',
                  boxShadow: '0 0 10px rgba(0,229,255,0.1)',
                }}
              >
                {mode === 'stake' ? (
                  <Sprout className="w-4 h-4 text-[var(--accent-primary)]" />
                ) : (
                  <Minus className="w-4 h-4 text-[var(--accent-primary)]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {mode === 'stake' ? t('farms.stake_lp') : t('farms.unstake_lp')}
                </h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {farm.token0_symbol}/{farm.token1_symbol}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface-2)] transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {hasStaked && (
            <div className="px-5 pt-4">
              <div className="flex gap-1 p-0.5 rounded-xl bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-subtle)]">
                <button
                  onClick={() => { setMode('stake'); setAmount(''); setError(null); }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                    mode === 'stake'
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,229,255,0.08)]'
                      : 'text-[var(--text-secondary)]',
                  )}
                >
                  {t('farms.stake')}
                </button>
                <button
                  onClick={() => { setMode('unstake'); setAmount(''); setError(null); }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                    mode === 'unstake'
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-[0_0_8px_rgba(0,229,255,0.08)]'
                      : 'text-[var(--text-secondary)]',
                  )}
                >
                  {t('farms.unstake')}
                </button>
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">
            {hasStaked && (
              <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">{t('farms.your_staked')}</span>
                  <span className="font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(farm.your_staked_usd ?? 0)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">
                {t('farms.amount')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.0"
                  className={cn(
                    'w-full px-4 py-3 pr-16 rounded-xl',
                    'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
                    'text-lg font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                    'focus:border-[var(--border-active)] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.06)]',
                    'focus:outline-none transition-all duration-200',
                    error && 'border-[var(--accent-danger)]/40',
                  )}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  onClick={handleMax}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold hover:bg-[var(--accent-primary)]/20 transition-colors"
                >
                  {t('common.max')}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-[var(--text-tertiary)]">
                <span>{t('pools.lp_tokens')}</span>
                {mode === 'unstake' && (
                  <span>
                    {t('farms.available')}: {formatNumber(farm.your_staked_lp ?? 0)}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/20">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-danger)] flex-shrink-0" />
                <span className="text-xs text-[var(--accent-danger)]">{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || isTxLoading}
              className="btn-primary w-full"
            >
              {isTxLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.confirming')}
                </>
              ) : mode === 'stake' ? (
                <>
                  <Sprout className="w-4 h-4" />
                  {t('farms.stake')}
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4" />
                  {t('farms.unstake')}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
