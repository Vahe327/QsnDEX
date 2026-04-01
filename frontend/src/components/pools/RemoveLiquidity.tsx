'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { Minus } from 'lucide-react';
import { type Address } from 'viem';
import { ConnectButton } from '@/components/common/ConnectButton';
import { PoolPairIcon } from './PoolPairIcon';
import { TokenIcon } from '@/components/common/TokenIcon';
import { TransactionModal, type TransactionStatus } from '@/components/common/TransactionModal';
import { useApprove } from '@/hooks/useApprove';
import { useRemoveLiquidity } from '@/hooks/useRemoveLiquidity';
import { useChain } from '@/hooks/useChain';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/formatters';

const PAIR_ABI = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getReserves', inputs: [], outputs: [{ name: 'reserve0', type: 'uint112' }, { name: 'reserve1', type: 'uint112' }, { name: 'blockTimestampLast', type: 'uint32' }], stateMutability: 'view' },
] as const;

interface RemoveLiquidityProps {
  poolAddress?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  token0Logo?: string;
  token1Logo?: string;
  token0Address?: string;
  token1Address?: string;
  token0Decimals?: number;
  token1Decimals?: number;
  fee?: number;
  lpBalance?: bigint;
  reserve0?: bigint;
  reserve1?: bigint;
  totalSupply?: bigint;
  className?: string;
}

const presets = [25, 50, 75, 100] as const;

export function RemoveLiquidity({
  poolAddress = '',
  token0Symbol = '',
  token1Symbol = '',
  token0Logo,
  token1Logo,
  token0Address = '',
  token1Address = '',
  token0Decimals = 18,
  token1Decimals = 18,
  fee = 3000,
  lpBalance = 0n,
  reserve0 = 0n,
  reserve1 = 0n,
  totalSupply = 0n,
  className,
}: RemoveLiquidityProps) {
  const { address: account, isConnected } = useAccount();
  const { contracts } = useChain();
  const [percent, setPercent] = useState(0);
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();

  const { data: onChainLpBalance } = useReadContract({
    address: poolAddress as Address,
    abi: PAIR_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!poolAddress && !!account },
  });

  const { data: onChainTotalSupply } = useReadContract({
    address: poolAddress as Address,
    abi: PAIR_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!poolAddress },
  });

  const { data: onChainReserves } = useReadContract({
    address: poolAddress as Address,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: { enabled: !!poolAddress },
  });

  const effectiveLpBalance = (onChainLpBalance as bigint) ?? lpBalance;
  const effectiveTotalSupply = (onChainTotalSupply as bigint) ?? totalSupply;
  const effectiveReserve0 = (onChainReserves as any)?.[0] ? BigInt((onChainReserves as any)[0]) : reserve0;
  const effectiveReserve1 = (onChainReserves as any)?.[1] ? BigInt((onChainReserves as any)[1]) : reserve1;

  const liquidityToRemove = useMemo(() => {
    if (percent === 0 || effectiveLpBalance === 0n) return 0n;
    return (effectiveLpBalance * BigInt(percent)) / 100n;
  }, [percent, effectiveLpBalance]);

  const estimatedAmount0 = useMemo(() => {
    if (effectiveTotalSupply === 0n || liquidityToRemove === 0n) return 0n;
    return (effectiveReserve0 * liquidityToRemove) / effectiveTotalSupply;
  }, [effectiveReserve0, liquidityToRemove, effectiveTotalSupply]);

  const estimatedAmount1 = useMemo(() => {
    if (effectiveTotalSupply === 0n || liquidityToRemove === 0n) return 0n;
    return (effectiveReserve1 * liquidityToRemove) / effectiveTotalSupply;
  }, [effectiveReserve1, liquidityToRemove, effectiveTotalSupply]);

  const approve = useApprove({
    tokenAddress: poolAddress,
    spenderAddress: contracts.router,
    amount: liquidityToRemove,
  });

  const removeLiquidity = useRemoveLiquidity({
    tokenA: token0Address,
    tokenB: token1Address,
    fee,
    liquidity: liquidityToRemove,
    amountAMin: estimatedAmount0,
    amountBMin: estimatedAmount1,
  });

  async function handleSubmit() {
    if (!isConnected || percent === 0) return;

    try {
      if (approve.needsApproval) {
        setTxStatus('waiting_approval');
        await approve.approve();
        approve.refetchAllowance();
      }

      setTxStatus('waiting_confirmation');
      const hash = await removeLiquidity.execute();
      setTxHash(hash);
      setTxStatus('pending');
    } catch (err: any) {
      if (err?.message?.includes('reject') || err?.code === 4001) {
        setTxStatus('rejected');
      } else {
        setTxStatus('failed');
      }
    }
  }

  useEffect(() => {
    if (removeLiquidity.isSuccess && txStatus === 'pending') {
      setTxStatus('success');
      setPercent(0);
    }
  }, [removeLiquidity.isSuccess, txStatus]);

  function getButtonLabel(): string {
    if (!isConnected) return t('common.connect_wallet');
    if (percent === 0) return t('pools.remove_percent');
    if (approve.needsApproval) return t('common.approve');
    return t('pools.remove_liquidity');
  }

  const isDisabled = !isConnected || percent === 0 || removeLiquidity.isLoading;

  return (
    <div className={cn('card-glow p-6 max-w-[480px] w-full mx-auto', className)}>
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5" style={{ fontFamily: 'var(--font-heading)' }}>
        {t('pools.remove_liquidity')}
      </h2>

      <div className="flex items-center gap-3 mb-6">
        <PoolPairIcon
          token0Symbol={token0Symbol}
          token1Symbol={token1Symbol}
          token0Logo={token0Logo}
          token1Logo={token1Logo}
          size="md"
        />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {token0Symbol}/{token1Symbol}
        </span>
      </div>

      <div className="text-center mb-4">
        <motion.span
          key={percent}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold gradient-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {percent}%
        </motion.span>
      </div>

      <div className="mb-4 px-2">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--bg-input)]',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)]',
            '[&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,229,255,0.5)] [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-[var(--accent-primary)] [&::-moz-range-thumb]:border-none',
            '[&::-moz-range-thumb]:shadow-[0_0_12px_rgba(0,229,255,0.5)] [&::-moz-range-thumb]:cursor-pointer',
          )}
          style={{
            background: `linear-gradient(to right, var(--accent-primary) ${percent}%, var(--bg-input) ${percent}%)`,
          }}
        />
      </div>

      <div className="flex gap-2 mb-6">
        {presets.map((val) => (
          <button
            key={val}
            onClick={() => setPercent(val)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
              percent === val
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-glow)]',
            )}
          >
            {val === 100 ? t('common.max') : `${val}%`}
          </button>
        ))}
      </div>

      {percent > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]"
        >
          <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
            {t('pools.you_will_receive')}
          </span>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{token0Symbol}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatTokenAmount(estimatedAmount0, token0Decimals)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{token1Symbol}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatTokenAmount(estimatedAmount1, token1Decimals)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {!isConnected ? (
        <ConnectButton className="w-full" />
      ) : (
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={cn(
            'btn-primary w-full',
            percent > 0 && '!bg-gradient-to-r !from-[var(--accent-danger)] !to-[var(--accent-warning)]',
          )}
        >
          {removeLiquidity.isLoading ? (
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Minus size={18} />
              {getButtonLabel()}
            </>
          )}
        </button>
      )}

      {txStatus && (
        <TransactionModal
          isOpen={!!txStatus}
          onClose={() => setTxStatus(null)}
          status={txStatus}
          txHash={txHash}
          onRetry={handleSubmit}
        />
      )}
    </div>
  );
}
