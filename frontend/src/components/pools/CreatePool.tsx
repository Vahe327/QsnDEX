'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { Sparkles, AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { NumberInput } from '@/components/common/NumberInput';
import { ConnectButton } from '@/components/common/ConnectButton';
import { FeeSelector } from './FeeSelector';
import { TransactionModal, type TransactionStatus } from '@/components/common/TransactionModal';
import { Badge } from '@/components/common/Badge';
import { useTokens } from '@/hooks/useTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApprove } from '@/hooks/useApprove';
import { useAddLiquidity } from '@/hooks/useAddLiquidity';
import { FACTORY_ABI } from '@/config/contracts';
import { useChain } from '@/hooks/useChain';
import { type TokenInfo, NATIVE_ETH } from '@/config/tokens';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface CreatePoolProps {
  className?: string;
}

export function CreatePool({ className }: CreatePoolProps) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { allTokens, getToken, importToken } = useTokens();
  const { contracts } = useChain();

  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [fee, setFee] = useState(3000);
  const [showSelectA, setShowSelectA] = useState(false);
  const [showSelectB, setShowSelectB] = useState(false);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const selectARef = useRef<HTMLDivElement>(null);
  const selectBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSelectA && !showSelectB) return;
    const handler = (e: MouseEvent) => {
      if (showSelectA && selectARef.current && !selectARef.current.contains(e.target as Node)) {
        setShowSelectA(false);
      }
      if (showSelectB && selectBRef.current && !selectBRef.current.contains(e.target as Node)) {
        setShowSelectB(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSelectA, showSelectB]);
  const [step, setStep] = useState<'config' | 'amounts'>('config');
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();

  const balanceA = useTokenBalance({ tokenAddress: tokenA?.address, decimals: tokenA?.decimals, watch: true });
  const balanceB = useTokenBalance({ tokenAddress: tokenB?.address, decimals: tokenB?.decimals, watch: true });

  const amountAWei = useMemo(() => {
    if (!amountA || !tokenA) return 0n;
    try { return parseUnits(amountA, tokenA.decimals); } catch { return 0n; }
  }, [amountA, tokenA]);

  const amountBWei = useMemo(() => {
    if (!amountB || !tokenB) return 0n;
    try { return parseUnits(amountB, tokenB.decimals); } catch { return 0n; }
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

  const { writeContractAsync: createPair, data: createHash, isPending: isCreating } = useWriteContract();
  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash });

  const addLiquidity = useAddLiquidity({
    tokenA: tokenA?.address,
    tokenB: tokenB?.address,
    fee,
    amountA,
    amountB,
    decimalsA: tokenA?.decimals,
    decimalsB: tokenB?.decimals,
  });

  const pairSelected = !!tokenA && !!tokenB && tokenA.address !== tokenB.address;
  const hasAmounts = parseFloat(amountA) > 0 && parseFloat(amountB) > 0;
  const insufficientA = amountAWei > balanceA.balance;
  const insufficientB = amountBWei > balanceB.balance;

  function selectToken(token: TokenInfo, side: 'A' | 'B') {
    if (side === 'A') {
      if (tokenB?.address === token.address) setTokenB(tokenA);
      setTokenA(token);
      setShowSelectA(false);
    } else {
      if (tokenA?.address === token.address) setTokenA(tokenB);
      setTokenB(token);
      setShowSelectB(false);
    }
  }

  async function handleCreateAndAdd() {
    if (!isConnected || !tokenA || !tokenB || !hasAmounts) return;

    try {
      setTxStatus('waiting_confirmation');

      if (!isNativeA && approveA.needsApproval) {
        setTxStatus('waiting_approval');
        const txA = await approveA.approve();
        if (txA && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txA as `0x${string}` });
        }
        approveA.refetchAllowance();
      }
      if (!isNativeB && approveB.needsApproval) {
        setTxStatus('waiting_approval');
        const txB = await approveB.approve();
        if (txB && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txB as `0x${string}` });
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

  function getButtonLabel(): string {
    if (!isConnected) return t('common.connect_wallet');
    if (!pairSelected) return t('pools.select_pair');
    if (step === 'config') return t('pools.continue');
    if (!hasAmounts) return t('swap.enter_amount');
    if (insufficientA) return t('swap.insufficient_balance', { symbol: tokenA!.symbol });
    if (insufficientB) return t('swap.insufficient_balance', { symbol: tokenB!.symbol });
    return t('pools.create_pool');
  }

  const isLoading = isCreating || isCreateConfirming || addLiquidity.isLoading;

  return (
    <div className={cn('card-glow p-6 max-w-[480px] w-full mx-auto', className)}>
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: '0 0 12px rgba(0,229,255,0.2)',
          }}
        >
          <Sparkles size={16} className="text-[var(--bg-deep)]" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pools.create_pool')}
        </h2>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--accent-warning)]/8 border border-[var(--accent-warning)]/15 mb-5">
        <AlertTriangle size={16} className="text-[var(--accent-warning)] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[var(--text-secondary)]">
          {t('pools.create_first_pool')} {t('pools.create_first_pool_desc')}
        </p>
      </div>

      {step === 'config' ? (
        <>
          <div className="space-y-3 mb-5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              {t('pools.select_pair')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div ref={selectARef}>
                <button
                  onClick={() => setShowSelectA(!showSelectA)}
                  className="w-full btn-secondary h-12 flex items-center justify-center gap-2"
                >
                  {tokenA ? (
                    <span className="font-bold">{tokenA.symbol}</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">{t('swap.select_token')}</span>
                  )}
                </button>
                {showSelectA && (
                  <div
                    className="mt-1 relative z-50 p-2 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: 'var(--shadow-xl)',
                    }}
                  >
                    <input
                      type="text"
                      value={searchA}
                      onChange={(e) => setSearchA(e.target.value)}
                      placeholder={t('swap.searchTokenPlaceholder')}
                      className="w-full bg-transparent text-sm outline-none px-2 py-1.5 mb-2 rounded-lg border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {allTokens
                        .filter((tk) => {
                          if (!searchA.trim()) return true;
                          const q = searchA.toLowerCase();
                          return tk.symbol.toLowerCase().includes(q) || tk.name.toLowerCase().includes(q) || tk.address.toLowerCase().includes(q);
                        })
                        .map((tk) => (
                          <button
                            key={tk.address}
                            onClick={() => { selectToken(tk, 'A'); setSearchA(''); }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors text-left"
                          >
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{tk.symbol}</span>
                            <span className="text-xs text-[var(--text-tertiary)]">{tk.name}</span>
                          </button>
                        ))}
                      {searchA.trim().length === 42 && searchA.startsWith('0x') && !allTokens.find((t) => t.address.toLowerCase() === searchA.toLowerCase()) && (
                        <button
                          onClick={async () => {
                            try {
                              const result = await importToken(searchA);
                              if (result?.token) {
                                selectToken({
                                  chainId: result.token.chainId || 421614,
                                  address: result.token.address,
                                  name: result.token.name,
                                  symbol: result.token.symbol,
                                  decimals: result.token.decimals,
                                  logoURI: '',
                                }, 'A');
                                setSearchA('');
                              }
                            } catch {}
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors text-left"
                        >
                          <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>{t('swap.importToken')}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">{searchA.slice(0, 6)}...{searchA.slice(-4)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div ref={selectBRef}>
                <button
                  onClick={() => setShowSelectB(!showSelectB)}
                  className="w-full btn-secondary h-12 flex items-center justify-center gap-2"
                >
                  {tokenB ? (
                    <span className="font-bold">{tokenB.symbol}</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">{t('swap.select_token')}</span>
                  )}
                </button>
                {showSelectB && (
                  <div
                    className="mt-1 relative z-50 p-2 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: 'var(--shadow-xl)',
                    }}
                  >
                    <input
                      type="text"
                      value={searchB}
                      onChange={(e) => setSearchB(e.target.value)}
                      placeholder={t('swap.searchTokenPlaceholder')}
                      className="w-full bg-transparent text-sm outline-none px-2 py-1.5 mb-2 rounded-lg border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {allTokens
                        .filter((tk) => {
                          if (!searchB.trim()) return true;
                          const q = searchB.toLowerCase();
                          return tk.symbol.toLowerCase().includes(q) || tk.name.toLowerCase().includes(q) || tk.address.toLowerCase().includes(q);
                        })
                        .map((tk) => (
                          <button
                            key={tk.address}
                            onClick={() => { selectToken(tk, 'B'); setSearchB(''); }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors text-left"
                          >
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{tk.symbol}</span>
                            <span className="text-xs text-[var(--text-tertiary)]">{tk.name}</span>
                          </button>
                        ))}
                      {searchB.trim().length === 42 && searchB.startsWith('0x') && !allTokens.find((t) => t.address.toLowerCase() === searchB.toLowerCase()) && (
                        <button
                          onClick={async () => {
                            try {
                              const result = await importToken(searchB);
                              if (result?.token) {
                                selectToken({
                                  chainId: result.token.chainId || 421614,
                                  address: result.token.address,
                                  name: result.token.name,
                                  symbol: result.token.symbol,
                                  decimals: result.token.decimals,
                                  logoURI: '',
                                }, 'B');
                                setSearchB('');
                              }
                            } catch {}
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors text-left"
                        >
                          <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>{t('swap.importToken')}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">{searchB.slice(0, 6)}...{searchB.slice(-4)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <FeeSelector selected={fee} onChange={setFee} className="mb-6" />

          {!isConnected ? (
            <ConnectButton className="w-full" />
          ) : (
            <button
              onClick={() => pairSelected && setStep('amounts')}
              disabled={!pairSelected}
              className="btn-primary w-full"
            >
              {getButtonLabel()}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] mb-5">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {tokenA!.symbol}/{tokenB!.symbol}
            </span>
            <Badge variant="default" className="text-[10px]">
              {fee <= 100 ? '0.01%' : fee <= 500 ? '0.05%' : fee <= 3000 ? '0.30%' : '1.00%'}
            </Badge>
            <button
              onClick={() => setStep('config')}
              className="ml-auto text-xs text-[var(--accent-primary)] hover:underline"
            >
              {t('pools.edit')}
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <NumberInput
              value={amountA}
              onChange={setAmountA}
              label={tokenA!.symbol}
              onMax={() => setAmountA(balanceA.formatted)}
            />
            <p className="text-xs text-[var(--text-tertiary)] px-1">
              {t('common.balance')}: {balanceA.formatted}
            </p>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Plus size={16} className="text-[var(--text-secondary)]" />
              </div>
            </div>

            <NumberInput
              value={amountB}
              onChange={setAmountB}
              label={tokenB!.symbol}
              onMax={() => setAmountB(balanceB.formatted)}
            />
            <p className="text-xs text-[var(--text-tertiary)] px-1">
              {t('common.balance')}: {balanceB.formatted}
            </p>
          </div>

          {hasAmounts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]"
            >
              <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                {t('pools.initial_price')}
              </span>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                1 {tokenA!.symbol} = {(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)} {tokenB!.symbol}
              </p>
              <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                1 {tokenB!.symbol} = {(parseFloat(amountA) / parseFloat(amountB)).toFixed(6)} {tokenA!.symbol}
              </p>
            </motion.div>
          )}

          <button
            onClick={handleCreateAndAdd}
            disabled={!hasAmounts || insufficientA || insufficientB || isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Sparkles size={18} />
                {getButtonLabel()}
              </>
            )}
          </button>
        </>
      )}

      {txStatus && (
        <TransactionModal
          isOpen={!!txStatus}
          onClose={() => setTxStatus(null)}
          status={txStatus}
          txHash={txHash}
          onRetry={handleCreateAndAdd}
        />
      )}
    </div>
  );
}
