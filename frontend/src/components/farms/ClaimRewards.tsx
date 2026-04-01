'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
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
  pending_rewards?: number;
  pending_rewards_usd?: number;
}

interface ClaimRewardsProps {
  farm: Farm;
  onClose: () => void;
}

export function ClaimRewards({ farm, onClose }: ClaimRewardsProps) {
  const { address: account } = useAccount();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  const { getGasOverrides } = useGasOverrides();
  const isTxLoading = isPending || isConfirming;
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const pendingRewards = farm.pending_rewards ?? 0;
  const pendingUsd = farm.pending_rewards_usd ?? 0;

  const handleClaim = useCallback(async () => {
    if (!account) {
      setError(t('common.connect_wallet'));
      return;
    }

    try {
      setError(null);
      const gas = await getGasOverrides();
      await writeContractAsync({
        address: farm.pool_address as `0x${string}`,
        abi: [{
          type: 'function',
          name: 'claimRewards',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable',
        }],
        functionName: 'claimRewards',
        args: [],
        ...gas,
      });
      setClaimed(true);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  }, [account, farm, writeContractAsync, getGasOverrides]);

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
            'card relative w-full max-w-sm overflow-hidden',
            'bg-surface',
          )}
        >
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent-tertiary)] to-transparent opacity-40" />

          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(240,180,41,0.1))',
                  boxShadow: '0 0 10px rgba(16,185,129,0.1)',
                }}
              >
                <Gift className="w-4 h-4 text-[var(--accent-tertiary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('farms.claim_rewards')}</h3>
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

          <div className="p-5 space-y-5">
            {claimed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 gap-3"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(240,180,41,0.1))',
                    boxShadow: '0 0 24px rgba(16,185,129,0.15)',
                  }}
                >
                  <CheckCircle2 className="w-7 h-7 text-[var(--accent-tertiary)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    {t('farms.claim_success')}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatNumber(pendingRewards)} {farm.reward_token_symbol} {t('farms.claimed')}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="btn-secondary px-6 py-2 text-sm"
                >
                  {t('common.close')}
                </button>
              </motion.div>
            ) : (
              <>
                <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-5 text-center">
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">{t('farms.pending_rewards')}</p>
                  <p
                    className="text-2xl font-bold text-[var(--text-primary)] tracking-tight"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatNumber(pendingRewards)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">{farm.reward_token_symbol}</p>
                  {pendingUsd > 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                      ~{formatUSD(pendingUsd)}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/20">
                    <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-danger)] flex-shrink-0" />
                    <span className="text-xs text-[var(--accent-danger)]">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleClaim}
                  disabled={pendingRewards <= 0 || isTxLoading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                    'text-sm font-bold transition-all duration-200',
                    'text-[var(--bg-deep)] active:scale-[0.98]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                  )}
                  style={{
                    background: 'linear-gradient(135deg, #F0B429, #D97706)',
                    boxShadow: '0 4px 20px rgba(240,180,41,0.25)',
                  }}
                >
                  {isTxLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.confirming')}
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      {t('farms.claim_rewards')}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
