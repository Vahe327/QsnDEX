'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Plus, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { NumberInput } from '@/components/common/NumberInput';
import { ConnectButton } from '@/components/common/ConnectButton';
import { FeeSelector } from './FeeSelector';
import { PoolPairIcon } from './PoolPairIcon';
import { ImpermanentLossInfo } from './ImpermanentLossInfo';
import { TransactionModal, type TransactionStatus } from '@/components/common/TransactionModal';
import { Tooltip } from '@/components/common/Tooltip';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApprove } from '@/hooks/useApprove';
import { useAddLiquidity } from '@/hooks/useAddLiquidity';
import { useTokens } from '@/hooks/useTokens';
import { useChain } from '@/hooks/useChain';
import { FEE_TIERS, type TokenInfo, NATIVE_ETH } from '@/config/tokens';
import { api } from '@/lib/api';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface AddLiquidityProps {
  initialTokenA?: string;
  initialTokenB?: string;
  initialFee?: number;
  poolAddress?: string;
  className?: string;
}

export function AddLiquidity({
  initialTokenA,
  initialTokenB,
  initialFee = 3000,
  poolAddress,
  className,
}: AddLiquidityProps) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { contracts, chainId } = useChain();
  const { allTokens, getToken } = useTokens();

  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [fee, setFee] = useState(initialFee);
  const [tokensInitialized, setTokensInitialized] = useState(false);
  const [lastEdited, setLastEdited] = useState<'A' | 'B' | null>(null);

  const { data: poolData } = useQuery({
    queryKey: ['poolReserves', chainId, poolAddress],
    queryFn: () => api.getPool(poolAddress!, chainId),
    enabled: !!poolAddress,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const pool = poolData?.pool;
  const reserve0 = pool?.reserve0_formatted != null ? parseFloat(pool.reserve0_formatted) : 0;
  const reserve1 = pool?.reserve1_formatted != null ? parseFloat(pool.reserve1_formatted) : 0;
  const hasReserves = reserve0 > 0 && reserve1 > 0;

  const poolToken0 = pool?.token0?.toLowerCase();
  const poolToken1 = pool?.token1?.toLowerCase();

  const isTokenAPoolToken0 = useMemo(() => {
    if (!tokenA || !poolToken0) return true;
    const addrA = tokenA.address.toLowerCase() === NATIVE_ETH.address.toLowerCase()
      ? contracts.weth?.toLowerCase()
      : tokenA.address.toLowerCase();
    return addrA === poolToken0;
  }, [tokenA, poolToken0, contracts.weth]);

  const ratioAtoB = useMemo(() => {
    if (!hasReserves) return null;
    if (isTokenAPoolToken0) {
      return reserve1 / reserve0;
    }
    return reserve0 / reserve1;
  }, [hasReserves, reserve0, reserve1, isTokenAPoolToken0]);

  const ratioBtoA = useMemo(() => {
    if (!ratioAtoB || ratioAtoB === 0) return null;
    return 1 / ratioAtoB;
  }, [ratioAtoB]);

  useEffect(() => {
    if (initialTokenA && initialTokenB) {
      const a = getToken(initialTokenA);
      const b = getToken(initialTokenB);
      if (a && b) {
        setTokenA(a);
        setTokenB(b);
        setTokensInitialized(true);
      }
      return;
    }
    if (!tokensInitialized && allTokens.length >= 2) {
      setTokenA(allTokens[0]);
      setTokenB(allTokens[1]);
      setTokensInitialized(true);
    }
  }, [initialTokenA, initialTokenB, allTokens, getToken, tokensInitialized]);

  useEffect(() => {
    if (initialFee && initialFee !== fee) setFee(initialFee);
  }, [initialFee]);

  const handleAmountAChange = useCallback((val: string) => {
    setAmountA(val);
    setLastEdited('A');
    if (ratioAtoB && val && parseFloat(val) > 0) {
      const computed = parseFloat(val) * ratioAtoB;
      setAmountB(computed > 0 ? computed.toPrecision(8).replace(/\.?0+$/, '') : '');
    } else if (!val) {
      setAmountB('');
    }
  }, [ratioAtoB]);

  const handleAmountBChange = useCallback((val: string) => {
    setAmountB(val);
    setLastEdited('B');
    if (ratioBtoA && val && parseFloat(val) > 0) {
      const computed = parseFloat(val) * ratioBtoA;
      setAmountA(computed > 0 ? computed.toPrecision(8).replace(/\.?0+$/, '') : '');
    } else if (!val) {
      setAmountA('');
    }
  }, [ratioBtoA]);

  const [showTokenSelectA, setShowTokenSelectA] = useState(false);
  const [showTokenSelectB, setShowTokenSelectB] = useState(false);
  const selectARef = useRef<HTMLDivElement>(null);
  const selectBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTokenSelectA && !showTokenSelectB) return;
    const handler = (e: MouseEvent) => {
      if (showTokenSelectA && selectARef.current && !selectARef.current.contains(e.target as Node)) {
        setShowTokenSelectA(false);
      }
      if (showTokenSelectB && selectBRef.current && !selectBRef.current.contains(e.target as Node)) {
        setShowTokenSelectB(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTokenSelectA, showTokenSelectB]);
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();

  const balanceA = useTokenBalance({
    tokenAddress: tokenA?.address,
    decimals: tokenA?.decimals,
    watch: true,
  });
  const balanceB = useTokenBalance({
    tokenAddress: tokenB?.address,
    decimals: tokenB?.decimals,
    watch: true,
  });

  const amountAWei = useMemo(() => {
    if (!amountA || !tokenA) return 0n;
    try {
      return parseUnits(amountA, tokenA.decimals);
    } catch {
      return 0n;
    }
  }, [amountA, tokenA]);

  const amountBWei = useMemo(() => {
    if (!amountB || !tokenB) return 0n;
    try {
      return parseUnits(amountB, tokenB.decimals);
    } catch {
      return 0n;
    }
  }, [amountB, tokenB]);

  const isNativeA = tokenA?.address === NATIVE_ETH.address;
  const isNativeB = tokenB?.address === NATIVE_ETH.address;

  const approveA = useApprove({
    tokenAddress: isNativeA ? undefined : tokenA?.address,
    spenderAddress: contracts.router,
    amount: amountAWei,
  });
  const approveB = useApprove({
    tokenAddress: isNativeB ? undefined : tokenB?.address,
    spenderAddress: contracts.router,
    amount: amountBWei,
  });

  const addLiquidity = useAddLiquidity({
    tokenA: tokenA?.address,
    tokenB: tokenB?.address,
    fee,
    amountA,
    amountB,
    decimalsA: tokenA?.decimals,
    decimalsB: tokenB?.decimals,
  });

  const needsApproveA = !isNativeA && approveA.needsApproval;
  const needsApproveB = !isNativeB && approveB.needsApproval;
  const hasAmounts = parseFloat(amountA) > 0 && parseFloat(amountB) > 0;
  const insufficientA = amountAWei > balanceA.balance;
  const insufficientB = amountBWei > balanceB.balance;

  function getButtonLabel(): string {
    if (!isConnected) return t('common.connect_wallet');
    if (!tokenA || !tokenB) return t('pools.select_pair');
    if (!hasAmounts) return t('swap.enter_amount');
    if (insufficientA) return t('swap.insufficient_balance', { symbol: tokenA.symbol });
    if (insufficientB) return t('swap.insufficient_balance', { symbol: tokenB.symbol });
    if (needsApproveA) return t('swap.approve', { symbol: tokenA.symbol });
    if (needsApproveB) return t('swap.approve', { symbol: tokenB.symbol });
    return t('pools.add_liquidity');
  }

  async function handleSubmit() {
    if (!isConnected || !hasAmounts) return;

    try {
      if (needsApproveA) {
        setTxStatus('waiting_approval');
        const approveTxA = await approveA.approve();
        if (approveTxA && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTxA as `0x${string}` });
        }
        approveA.refetchAllowance();
      }

      if (needsApproveB) {
        setTxStatus('waiting_approval');
        const approveTxB = await approveB.approve();
        if (approveTxB && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTxB as `0x${string}` });
        }
        approveB.refetchAllowance();
      }

      setTxStatus('waiting_confirmation');
      const hash = await addLiquidity.execute();
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
    if (addLiquidity.isSuccess && txStatus === 'pending') {
      setTxStatus('success');
      setAmountA('');
      setAmountB('');
    }
  }, [addLiquidity.isSuccess, txStatus]);

  function selectToken(token: TokenInfo, side: 'A' | 'B') {
    if (side === 'A') {
      if (tokenB?.address === token.address) setTokenB(tokenA);
      setTokenA(token);
      setShowTokenSelectA(false);
    } else {
      if (tokenA?.address === token.address) setTokenA(tokenB);
      setTokenB(token);
      setShowTokenSelectB(false);
    }
  }

  const isDisabled = !isConnected || !hasAmounts || insufficientA || insufficientB || addLiquidity.isLoading;

  return (
    <div className={cn('card-glow p-6 max-w-[480px] w-full mx-auto', className)}>
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5" style={{ fontFamily: 'var(--font-heading)' }}>
        {t('pools.add_liquidity')}
      </h2>

      <FeeSelector selected={fee} onChange={setFee} className="mb-5" />

      {hasReserves && ratioAtoB && tokenA && tokenB && (
        <div className="mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)' }}
        >
          <Info size={12} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            1 {tokenA.symbol} = {ratioAtoB >= 0.01 ? ratioAtoB.toFixed(6) : ratioAtoB.toPrecision(4)} {tokenB.symbol}
          </span>
        </div>
      )}

      <div className="mb-3" ref={selectARef}>
        <NumberInput
          value={amountA}
          onChange={handleAmountAChange}
          label={tokenA?.symbol ?? 'Token A'}
          onMax={() => handleAmountAChange(balanceA.formatted)}
          suffix={
            <button
              onClick={() => setShowTokenSelectA(!showTokenSelectA)}
              className="btn-secondary flex items-center gap-2 h-9 px-3 text-sm"
            >
              {tokenA ? (
                <span className="font-semibold">{tokenA.symbol}</span>
              ) : (
                t('swap.select_token')
              )}
            </button>
          }
        />
        {tokenA && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1 px-1">
            {t('common.balance')}: {balanceA.formatted}
          </p>
        )}

        {showTokenSelectA && (
          <div className="mt-2 relative z-50 p-3 max-h-[240px] overflow-y-auto rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: 'var(--shadow-xl)',
                    }}>
            {allTokens.map((tk) => (
              <button
                key={tk.address}
                onClick={() => selectToken(tk, 'A')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors text-left"
              >
                <span className="text-sm font-semibold text-[var(--text-primary)]">{tk.symbol}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{tk.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center my-1">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
          <Plus size={16} className="text-[var(--text-secondary)]" />
        </div>
      </div>

      <div className="mb-5" ref={selectBRef}>
        <NumberInput
          value={amountB}
          onChange={handleAmountBChange}
          label={tokenB?.symbol ?? 'Token B'}
          onMax={() => handleAmountBChange(balanceB.formatted)}
          suffix={
            <button
              onClick={() => setShowTokenSelectB(!showTokenSelectB)}
              className="btn-secondary flex items-center gap-2 h-9 px-3 text-sm"
            >
              {tokenB ? (
                <span className="font-semibold">{tokenB.symbol}</span>
              ) : (
                t('swap.select_token')
              )}
            </button>
          }
        />
        {tokenB && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1 px-1">
            {t('common.balance')}: {balanceB.formatted}
          </p>
        )}

        {showTokenSelectB && (
          <div className="mt-2 relative z-50 p-3 max-h-[240px] overflow-y-auto rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: 'var(--shadow-xl)',
                    }}>
            {allTokens.map((tk) => (
              <button
                key={tk.address}
                onClick={() => selectToken(tk, 'B')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors text-left"
              >
                <span className="text-sm font-semibold text-[var(--text-primary)]">{tk.symbol}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{tk.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {hasAmounts && tokenA && tokenB && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-[var(--accent-primary)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {t('pools.lp_token_preview')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <PoolPairIcon
              token0Symbol={tokenA.symbol}
              token1Symbol={tokenB.symbol}
              token0Logo={tokenA.logoURI}
              token1Logo={tokenB.logoURI}
              size="sm"
            />
            <span className="text-sm text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {tokenA.symbol}/{tokenB.symbol}
            </span>
            <Tooltip content={t('pools.lp_token_preview_tooltip')}>
              <Info size={12} className="text-[var(--text-tertiary)]" />
            </Tooltip>
          </div>
        </motion.div>
      )}

      <ImpermanentLossInfo className="mb-5" />

      {!isConnected ? (
        <ConnectButton className="w-full" />
      ) : (
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="btn-primary w-full"
        >
          {addLiquidity.isLoading ? (
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            getButtonLabel()
          )}
        </button>
      )}


      {txStatus && (
        <TransactionModal
          isOpen={!!txStatus}
          onClose={() => setTxStatus(null)}
          status={txStatus}
          txHash={txHash}
          tokenSymbol={tokenA?.symbol}
          onRetry={handleSubmit}
        />
      )}
    </div>
  );
}
