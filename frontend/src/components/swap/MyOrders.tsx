'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  X as XIcon,
  Loader2,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  ListOrdered,
} from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Address } from 'viem';
import { api } from '@/lib/api';
import { useChain } from '@/hooks/useChain';
import { useGasOverrides } from '@/hooks/useGasPrice';
import { formatNumber, shortenAddress } from '@/lib/formatters';
import { formatUnits } from 'viem';
import { useTokens } from '@/hooks/useTokens';
import type { TokenInfo } from '@/config/tokens';

const LIMIT_ORDER_ABI = [
  {
    type: 'function',
    name: 'cancelOrder',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

interface Order {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  targetPrice: string;
  deadline: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
}

export function MyOrders() {
  const { address: account } = useAccount();
  const { contracts, chainId } = useChain();
  const { getToken } = useTokens();
  const queryClient = useQueryClient();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['limitOrders', chainId, account],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/orders?wallet=${account}&chain_id=${chainId}`
      );
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      return json.orders as Order[];
    },
    enabled: !!account,
    refetchInterval: 30_000,
  });

  const orders = data ?? [];
  const activeOrders = orders.filter((o) => o.status === 'active');
  const pastOrders = orders.filter((o) => o.status !== 'active');

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  const { getGasOverrides } = useGasOverrides();
  const publicClient = usePublicClient();

  const handleCancel = useCallback(
    async (orderId: string) => {
      setCancellingId(orderId);
      try {
        const gas = await getGasOverrides();
        const txHash = await writeContractAsync({
          address: contracts.limitOrder as Address,
          abi: LIMIT_ORDER_ABI,
          functionName: 'cancelOrder',
          args: [BigInt(orderId)],
          ...gas,
        });
        if (publicClient && txHash) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }
        queryClient.invalidateQueries({ queryKey: ['limitOrders', chainId, account] });
      } catch {
      } finally {
        setCancellingId(null);
      }
    },
    [writeContractAsync, queryClient, account, chainId, getGasOverrides, contracts.limitOrder, publicClient]
  );

  const formatDeadline = useCallback((timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    if (diff <= 0) return t('swap.expired');
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }, []);

  const statusBadge = useCallback((status: Order['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
      filled: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
      cancelled: 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]',
      expired: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    };
    return (
      <span
        className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
          styles[status] || styles.cancelled
        )}
      >
        {status.toUpperCase()}
      </span>
    );
  }, []);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <ListOrdered className="w-10 h-10 mb-3" />
        <p className="text-sm">{t('swap.connectToViewOrders')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <AlertCircle className="w-8 h-8 mb-2 text-[var(--color-danger)]" />
        <p className="text-sm text-[var(--color-danger)]">{t('swap.errorLoadingOrders')}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <ListOrdered className="w-10 h-10 mb-3" />
        <p className="text-sm">{t('swap.noOrders')}</p>
      </div>
    );
  }

  const renderOrder = (order: Order) => {
    const tokenInInfo = getToken(order.tokenIn);
    const tokenOutInfo = getToken(order.tokenOut);
    const isCancelling = cancellingId === order.id;
    const isExpanded = expandedOrder === order.id;

    return (
      <motion.div
        key={order.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-200',
          'bg-[rgba(6,10,19,0.6)] border border-[rgba(56,189,248,0.04)]',
          'hover:border-[rgba(6,182,212,0.1)]'
        )}
      >
        <button
          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
          className="w-full flex items-center gap-3 p-3.5 hover:bg-[rgba(6,182,212,0.02)] transition-all duration-200"
        >
          <div className="flex items-center -space-x-2 shrink-0">
            <div className="z-10">
              <TokenIcon address={order.tokenIn} symbol={tokenInInfo?.symbol || '?'} logoURI={tokenInInfo?.logoURI} size="md" />
            </div>
            <TokenIcon address={order.tokenOut} symbol={tokenOutInfo?.symbol || '?'} logoURI={tokenOutInfo?.logoURI} size="md" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {tokenInInfo?.symbol || shortenAddress(order.tokenIn)}
              </span>
              <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]" />
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {tokenOutInfo?.symbol || shortenAddress(order.tokenOut)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-[var(--font-mono)]">
              {formatNumber(parseFloat(formatUnits(BigInt(order.amountIn || '0'), tokenInInfo?.decimals ?? 18)))} @ {order.targetPrice}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {statusBadge(order.status)}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-3.5 pt-0 space-y-2">
                <div className="gradient-divider" />
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[var(--color-text-muted)]">{t('swap.amount')}</span>
                    <p className="text-[var(--color-text-secondary)] font-medium mt-0.5 font-[var(--font-mono)]">
                      {formatNumber(parseFloat(formatUnits(BigInt(order.amountIn || '0'), tokenInInfo?.decimals ?? 18)))} {tokenInInfo?.symbol}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">{t('swap.targetPrice')}</span>
                    <p className="text-[var(--color-text-secondary)] font-medium mt-0.5 font-[var(--font-mono)]">
                      {order.targetPrice}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">{t('swap.expiry')}</span>
                    <p className="text-[var(--color-text-secondary)] font-medium mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDeadline(order.deadline)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">{t('swap.orderId')}</span>
                    <p className="text-[var(--color-text-secondary)] font-medium mt-0.5 font-[var(--font-mono)]">
                      #{order.id}
                    </p>
                  </div>
                </div>

                {order.status === 'active' && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleCancel(order.id)}
                    disabled={isCancelling}
                    className={cn(
                      'w-full mt-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                      'bg-[var(--color-danger)]/8 hover:bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
                      'disabled:opacity-50'
                    )}
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XIcon className="w-4 h-4" />
                    )}
                    {isCancelling ? t('swap.cancelling') : t('swap.cancelOrder')}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {activeOrders.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 px-1 uppercase tracking-wider">
            {t('swap.activeOrders')} ({activeOrders.length})
          </h4>
          <div className="space-y-2">{activeOrders.map(renderOrder)}</div>
        </div>
      )}
      {pastOrders.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 px-1 uppercase tracking-wider">
            {t('swap.pastOrders')} ({pastOrders.length})
          </h4>
          <div className="space-y-2">{pastOrders.map(renderOrder)}</div>
        </div>
      )}
    </div>
  );
}
