'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket, Clock, DollarSign, Link2, Image as ImageIcon, Globe, MessageCircle, Loader2, HelpCircle, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, type Address } from 'viem';
import { useChain } from '@/hooks/useChain';
import { useChainStore } from '@/store/chainStore';
import { useTokens } from '@/hooks/useTokens';
import { useApprove } from '@/hooks/useApprove';
import { TokenIcon } from '@/components/common/TokenIcon';
import { api } from '@/lib/api';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { NATIVE_ETH, type TokenInfo } from '@/config/tokens';

const LAUNCHPAD_ABI = [
  {
    type: 'function',
    name: 'createSale',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokensForSale', type: 'uint256' },
      { name: 'tokensForLiquidity', type: 'uint256' },
      { name: 'softCap', type: 'uint256' },
      { name: 'hardCap', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'liquidityPct', type: 'uint256' },
      { name: 'lpLockDuration', type: 'uint256' },
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_logoUrl', type: 'string' },
      { name: '_websiteUrl', type: 'string' },
      { name: '_socialUrl', type: 'string' },
    ],
    outputs: [{ name: 'saleId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createSaleFeeETH',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

function Tooltip({ tipKey, active, onToggle }: { tipKey: string; active: boolean; onToggle: () => void }) {
  const text = t(`launchpad.${tipKey}`);
  return (
    <span className="relative inline-flex">
      <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-0.5 rounded hover:bg-[var(--bg-surface-2)] transition">
        <HelpCircle size={13} className="text-[var(--text-tertiary)]" />
      </button>
      {active && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute bottom-full left-0 mb-2 z-50 p-3 rounded-xl border shadow-xl w-64 text-xs leading-relaxed"
            style={{
              background: 'var(--bg-surface, #1a1b23)',
              borderColor: 'var(--border-subtle, #2a2b35)',
              color: 'var(--text-secondary, #a0a0b0)',
            }}
          >
            {text}
          </div>
        </>
      )}
    </span>
  );
}

export default function CreateLaunchpadPage() {
  const router = useRouter();
  const { address: account } = useAccount();
  const { contracts, chainId } = useChain();
  const selectedChainId = useChainStore((s) => s.selectedChainId);
  const publicClient = usePublicClient({ chainId: selectedChainId });
  const { allTokens, getToken } = useTokens();

  const [token, setToken] = useState<TokenInfo | null>(null);
  const [tokensForSale, setTokensForSale] = useState('');
  const [tokensForLiquidity, setTokensForLiquidity] = useState('');
  const [softCap, setSoftCap] = useState('');
  const [hardCap, setHardCap] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liquidityPct, setLiquidityPct] = useState('51');
  const [lpLockDays, setLpLockDays] = useState('30');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const totalTokens = useMemo(() => {
    const sale = parseFloat(tokensForSale) || 0;
    const liq = parseFloat(tokensForLiquidity) || 0;
    return sale + liq;
  }, [tokensForSale, tokensForLiquidity]);

  const calculatedPrice = useMemo(() => {
    const hc = parseFloat(hardCap) || 0;
    const tfs = parseFloat(tokensForSale) || 0;
    if (tfs <= 0 || hc <= 0) return null;
    return hc / tfs;
  }, [hardCap, tokensForSale]);

  const totalTokensWei = useMemo(() => {
    if (!token || totalTokens <= 0) return 0n;
    try { return parseUnits(totalTokens.toString(), token.decimals); } catch { return 0n; }
  }, [totalTokens, token]);

  const { needsApproval, approve, isApproving } = useApprove({
    tokenAddress: token?.address,
    spenderAddress: contracts.launchpad,
    amount: totalTokensWei,
  });

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const isValid = useMemo(() => {
    if (!account || !token) return false;
    if (!tokensForSale || !tokensForLiquidity || !softCap || !hardCap) return false;
    if (!startDate || !endDate || !name) return false;
    if (parseFloat(softCap) <= 0 || parseFloat(hardCap) <= 0) return false;
    if (parseFloat(softCap) > parseFloat(hardCap)) return false;
    if (parseInt(lpLockDays) < 30) return false;
    return true;
  }, [account, token, tokensForSale, tokensForLiquidity, softCap, hardCap, startDate, endDate, name, lpLockDays]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || !token || !account) return;
    setError(null);

    try {
      if (needsApproval) {
        const tx = await approve();
        if (tx && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: tx as Address });
        }
      }

      let gasOvr: Record<string, bigint> = {};
      if (publicClient) {
        try {
          const feeData = await publicClient.estimateFeesPerGas();
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            gasOvr = { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas };
          } else {
            const gp = await publicClient.getGasPrice();
            if (gp > 0n) gasOvr = { gasPrice: gp } as any;
          }
        } catch {}
      }

      const saleTokensWei = parseUnits(tokensForSale, token.decimals);
      const liqTokensWei = parseUnits(tokensForLiquidity, token.decimals);
      const softCapWei = parseUnits(softCap, 18);
      const hardCapWei = parseUnits(hardCap, 18);
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      let start = BigInt(Math.floor(new Date(startDate).getTime() / 1000));
      const end = BigInt(Math.floor(new Date(endDate).getTime() / 1000));
      if (start < nowSec + 120n) {
        start = nowSec + 120n;
      }
      const liqPctBps = BigInt(parseInt(liquidityPct) * 100);
      const lockSeconds = BigInt(parseInt(lpLockDays) * 86400);

      const creationFee = parseUnits('0.001', 18);

      const txHash = await writeContractAsync({
        address: contracts.launchpad as Address,
        abi: LAUNCHPAD_ABI,
        functionName: 'createSale',
        args: [
          token.address as Address,
          saleTokensWei,
          liqTokensWei,
          softCapWei,
          hardCapWei,
          start,
          end,
          liqPctBps,
          lockSeconds,
          name,
          description,
          logoUrl,
          websiteUrl,
          socialUrl,
        ],
        value: creationFee,
        ...gasOvr,
      });

      if (txHash && publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
          await fetch(`${apiBase}/launchpad/callback/sync?chain_id=${chainId}`, { method: 'POST' });
        } catch {}
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('User denied') || msg.includes('rejected')) {
        setError(null);
      } else {
        setError(msg.length > 120 ? msg.slice(0, 120) + '...' : msg);
      }
    }
  }, [isValid, token, account, needsApproval, approve, publicClient, writeContractAsync,
    tokensForSale, tokensForLiquidity, softCap, hardCap, startDate, endDate, liquidityPct, lpLockDays,
    name, description, logoUrl, websiteUrl, socialUrl, contracts.launchpad]);

  const isProcessing = isPending || isConfirming || isApproving;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 md:py-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[var(--bg-surface-2)] transition">
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <div className="flex items-center gap-2">
          <Rocket size={24} className="text-[var(--accent-primary)]" />
          <h1 className="text-xl font-bold sm:text-2xl gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('launchpad.create_sale')}
          </h1>
        </div>
      </div>

      {isSuccess ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
          <Rocket size={48} className="mx-auto mb-4 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('launchpad.sale_created')}</h2>
          <button onClick={() => router.push('/app/launchpad')} className="btn-primary mt-4 px-6 py-3">
            {t('launchpad.view_sales')}
          </button>
        </motion.div>
      ) : (
        <div className="card p-6 space-y-5">
          <div>
            <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1">
              {t('launchpad.select_token')}
              <Tooltip tipKey="tip_select_token" active={activeTooltip === 'token'} onToggle={() => setActiveTooltip(activeTooltip === 'token' ? null : 'token')} />
            </label>
            <input
              type="text"
              placeholder={t('launchpad.search_placeholder')}
              value={token?.address || ''}
              onChange={async (e) => {
                const addr = e.target.value.trim();
                if (addr.startsWith('0x') && addr.length === 42) {
                  const found = getToken(addr);
                  if (found) {
                    setToken(found);
                  } else {
                    try {
                      const result = await api.importToken(addr, chainId);
                      if (result?.token) setToken(result.token);
                    } catch {}
                  }
                } else {
                  setToken(null);
                }
              }}
              className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] text-sm outline-none mb-2"
            />
            {token && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <TokenIcon address={token.address} symbol={token.symbol} size="md" />
                <div>
                  <span className="font-bold text-[var(--text-primary)]">{token.symbol}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-2">{token.name}</span>
                </div>
              </div>
            )}
            {!token && (
              <div className="mt-2 max-h-32 overflow-y-auto rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2">
                {allTokens.filter(tk => tk.address !== NATIVE_ETH.address).map(tk => (
                  <button key={tk.address} onClick={() => setToken(tk)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-[var(--bg-surface-2)] transition min-h-[40px]">
                    <TokenIcon address={tk.address} symbol={tk.symbol} size="xs" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{tk.symbol}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">{tk.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                {t('launchpad.sale_name')}
                <Tooltip tipKey="tip_sale_name" active={activeTooltip === 'name'} onToggle={() => setActiveTooltip(activeTooltip === 'name' ? null : 'name')} />
              </label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={t('launchpad.sale_name')}
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                {t('launchpad.description')}
                <Tooltip tipKey="tip_description" active={activeTooltip === 'desc'} onToggle={() => setActiveTooltip(activeTooltip === 'desc' ? null : 'desc')} />
              </label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('launchpad.description')}
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                {t('launchpad.tokens_for_sale')}
                <Tooltip tipKey="tip_tokens_for_sale" active={activeTooltip === 'tfs'} onToggle={() => setActiveTooltip(activeTooltip === 'tfs' ? null : 'tfs')} />
              </label>
              <input type="text" inputMode="decimal" value={tokensForSale} onChange={e => setTokensForSale(e.target.value)} placeholder="0"
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                {t('launchpad.tokens_for_liquidity')}
                <Tooltip tipKey="tip_tokens_for_liquidity" active={activeTooltip === 'tfl'} onToggle={() => setActiveTooltip(activeTooltip === 'tfl' ? null : 'tfl')} />
              </label>
              <input type="text" inputMode="decimal" value={tokensForLiquidity} onChange={e => setTokensForLiquidity(e.target.value)} placeholder="0"
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign size={12} /> {t('launchpad.soft_cap_label')}
                <Tooltip tipKey="tip_soft_cap" active={activeTooltip === 'sc'} onToggle={() => setActiveTooltip(activeTooltip === 'sc' ? null : 'sc')} />
              </label>
              <input type="text" inputMode="decimal" value={softCap} onChange={e => setSoftCap(e.target.value)} placeholder="0.1"
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign size={12} /> {t('launchpad.hard_cap_label')}
                <Tooltip tipKey="tip_hard_cap" active={activeTooltip === 'hc'} onToggle={() => setActiveTooltip(activeTooltip === 'hc' ? null : 'hc')} />
              </label>
              <input type="text" inputMode="decimal" value={hardCap} onChange={e => setHardCap(e.target.value)} placeholder="1.0"
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] outline-none" />
            </div>
          </div>

          {calculatedPrice !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: 'rgba(240,180,41,0.06)', borderColor: 'rgba(240,180,41,0.2)' }}
            >
              <Calculator size={18} className="text-[var(--accent-primary)] shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-[var(--text-tertiary)]">{t('launchpad.calculated_price')}</span>
                <span className="block text-sm font-bold text-[var(--accent-primary)] font-[var(--font-mono)]">
                  1 {token?.symbol || 'TOKEN'} = {calculatedPrice < 0.000001 ? calculatedPrice.toExponential(4) : calculatedPrice.toFixed(6)} ETH
                </span>
              </div>
              <Tooltip tipKey="price_tooltip" active={activeTooltip === 'price'} onToggle={() => setActiveTooltip(activeTooltip === 'price' ? null : 'price')} />
            </motion.div>
          )}

          {totalTokens > 0 && (
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-tertiary)]">{t('launchpad.total_tokens_needed')}</span>
                <span className="text-[var(--text-primary)] font-[var(--font-mono)]">{totalTokens.toLocaleString()} {token?.symbol || 'TOKEN'}</span>
              </div>
              {calculatedPrice !== null && (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">{t('launchpad.fdv_at_hardcap')}</span>
                  <span className="text-[var(--text-primary)] font-[var(--font-mono)]">{parseFloat(hardCap).toLocaleString()} ETH</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-tertiary)]">{t('launchpad.creation_fee')}</span>
                <span className="text-[var(--text-primary)] font-[var(--font-mono)]">0.001 ETH</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} /> {t('launchpad.start_time')}
                <Tooltip tipKey="tip_start_time" active={activeTooltip === 'st'} onToggle={() => setActiveTooltip(activeTooltip === 'st' ? null : 'st')} />
              </label>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} /> {t('launchpad.end_time')}
                <Tooltip tipKey="tip_end_time" active={activeTooltip === 'et'} onToggle={() => setActiveTooltip(activeTooltip === 'et' ? null : 'et')} />
              </label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                {t('launchpad.liquidity_pct')}
                <Tooltip tipKey="tip_liquidity_pct" active={activeTooltip === 'lp'} onToggle={() => setActiveTooltip(activeTooltip === 'lp' ? null : 'lp')} />
              </label>
              <input type="number" min="1" max="100" value={liquidityPct} onChange={e => setLiquidityPct(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                {t('launchpad.lp_lock_days')}
                <Tooltip tipKey="tip_lp_lock_days" active={activeTooltip === 'lpd'} onToggle={() => setActiveTooltip(activeTooltip === 'lpd' ? null : 'lpd')} />
              </label>
              <input type="number" min="30" value={lpLockDays} onChange={e => setLpLockDays(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-[var(--font-mono)] outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-1 mb-[-12px]">
            <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{t('launchpad.tip_links_label') || 'Links'}</label>
            <Tooltip tipKey="tip_links" active={activeTooltip === 'links'} onToggle={() => setActiveTooltip(activeTooltip === 'links' ? null : 'links')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <ImageIcon size={12} /> {t('launchpad.logo_url')}
              </label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Globe size={12} /> Website
              </label>
              <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..."
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <MessageCircle size={12} /> Social
              </label>
              <input value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="https://t.me/..."
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm outline-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/20 text-sm text-[var(--accent-danger)]">
              {error}
            </div>
          )}

          <motion.button
            whileHover={isValid && !isProcessing ? { scale: 1.01 } : {}}
            whileTap={isValid && !isProcessing ? { scale: 0.99 } : {}}
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className={cn(
              'btn-primary w-full h-14 rounded-2xl',
              (!isValid || isProcessing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket size={18} />}
            {isApproving ? t('swap.approving') : isProcessing ? t('launchpad.creating') : t('launchpad.create_sale')}
          </motion.button>
        </div>
      )}
    </div>
  );
}
