'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { formatNumber, formatUSD } from '@/lib/formatters';
import { shortenAddress, getExplorerUrl } from '@/lib/formatters';
import { createSwapsWebSocket, api } from '@/lib/api';
import { useChain } from '@/hooks/useChain';

interface Swap {
  tx_hash: string;
  sender: string;
  token_in_symbol: string;
  token_out_symbol: string;
  amount_in: number;
  amount_out: number;
  value_usd: number;
  timestamp: number;
}

interface RecentSwapsProps {
  maxItems?: number;
  className?: string;
}

export function RecentSwaps({ maxItems = 20, className }: RecentSwapsProps) {
  const { chainId } = useChain();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const [swapsRes, poolsRes] = await Promise.all([
          fetch(`${API_URL}/history/swaps?chain_id=${chainId}&limit=${maxItems}`),
          fetch(`${API_URL}/pools?chain_id=${chainId}&limit=50`),
        ]);
        if (!swapsRes.ok) return;
        const swapsData = await swapsRes.json();
        const poolsData = poolsRes.ok ? await poolsRes.json() : { pools: [] };

        const poolMap: Record<string, any> = {};
        for (const p of poolsData.pools ?? []) {
          poolMap[p.address?.toLowerCase()] = p;
        }

        const recentSwaps: Swap[] = (swapsData?.swaps ?? []).map((s: any) => {
          const pool = poolMap[s.pool_address?.toLowerCase()];
          const sym0 = pool?.token0_symbol || '???';
          const sym1 = pool?.token1_symbol || '???';

          const a0in = parseFloat(s.amount0_in) || 0;
          const a1in = parseFloat(s.amount1_in) || 0;
          const a0out = parseFloat(s.amount0_out) || 0;
          const a1out = parseFloat(s.amount1_out) || 0;
          const isBuy = a0in > 0;

          return {
            tx_hash: s.tx_hash,
            sender: s.to_address || s.sender,
            token_in_symbol: isBuy ? sym0 : sym1,
            token_out_symbol: isBuy ? sym1 : sym0,
            amount_in: isBuy ? a0in / 1e18 : a1in / 1e18,
            amount_out: isBuy ? a1out / 1e18 : a0out / 1e18,
            value_usd: 0,
            timestamp: Math.floor(new Date(s.timestamp).getTime() / 1000),
          };
        });
        if (recentSwaps.length > 0) setSwaps(recentSwaps);
      } catch {}
    };
    loadRecent();
  }, [chainId, maxItems]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = createSwapsWebSocket((data: any) => {
        if (data.type === 'swap' && data.swap) {
          setSwaps((prev) => {
            const next = [data.swap, ...prev];
            return next.slice(0, maxItems);
          });
        }
        if (data.type === 'initial' && Array.isArray(data.swaps)) {
          setSwaps(data.swaps.slice(0, maxItems));
        }
      });

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();

      wsRef.current = ws;
    } catch {
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [maxItems]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const formatTime = (ts: number): string => {
    const diff = Math.floor((Date.now() - ts * 1000) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'card overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-tertiary)]/10 flex items-center justify-center">
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--accent-tertiary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('analytics.recent_swaps')}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-tertiary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-tertiary)]" />
              </span>
              <Wifi className="w-3 h-3 text-[var(--accent-tertiary)]" />
            </>
          ) : (
            <WifiOff className="w-3 h-3 text-[var(--text-tertiary)]" />
          )}
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {connected ? t('analytics.live') : t('analytics.disconnected')}
          </span>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {swaps.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ArrowRightLeft className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">
              {connected ? t('analytics.waiting_swaps') : t('analytics.connecting')}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {swaps.map((swap, idx) => (
              <motion.div
                key={swap.tx_hash || idx}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-surface-3)]/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(swap.amount_in)}</span>
                    <span className="text-[var(--text-secondary)]">{swap.token_in_symbol}</span>
                    <ArrowRightLeft className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(swap.amount_out)}</span>
                    <span className="text-[var(--text-secondary)]">{swap.token_out_symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{shortenAddress(swap.sender)}</span>
                    <span>{formatTime(swap.timestamp)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(swap.value_usd)}
                  </span>
                  {swap.tx_hash && (
                    <a
                      href={getExplorerUrl(swap.tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
