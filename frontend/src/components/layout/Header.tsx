'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/layout/ThemeProvider';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Clock,
  Globe,
  X,
  Bell,
  BellRing,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Navigation } from './Navigation';
import { ChainSwitcher } from './ChainSwitcher';
import { cn } from '@/lib/utils';
import { t, getLocale, setLocale } from '@/i18n';
import { useChain } from '@/hooks/useChain';
import { formatNumber, shortenAddress, getExplorerUrl } from '@/lib/formatters';
import { ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAlertCount, useTriggeredAlerts, useDismissAlert } from '@/hooks/useAlerts';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { chainId } = useChain();
  const { address } = useAccount();
  const alertCount = useAlertCount(address);
  const triggeredAlerts = useTriggeredAlerts(address);
  const dismissAlertMut = useDismissAlert();
  const [locale, setCurrentLocale] = useState<string>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showRecentTx, setShowRecentTx] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const langRef = useRef<HTMLDivElement>(null);
  const txRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const unreadCount = alertCount.data ?? 0;
  const notifications = triggeredAlerts.data ?? [];

  useEffect(() => {
    if (!showRecentTx) return;
    const load = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const [swapsRes, poolsRes] = await Promise.all([
          fetch(`${API_URL}/history/swaps?chain_id=${chainId}&limit=10`),
          fetch(`${API_URL}/pools?chain_id=${chainId}&limit=50`),
        ]);
        if (!swapsRes.ok) return;
        const swapsData = await swapsRes.json();
        const poolsData = poolsRes.ok ? await poolsRes.json() : { pools: [] };
        const poolMap: Record<string, any> = {};
        for (const p of poolsData.pools ?? []) poolMap[p.address?.toLowerCase()] = p;

        setRecentTxs((swapsData?.swaps ?? []).map((s: any) => {
          const pool = poolMap[s.pool_address?.toLowerCase()];
          const a0in = parseFloat(s.amount0_in) || 0;
          const a1out = parseFloat(s.amount1_out) || 0;
          const a1in = parseFloat(s.amount1_in) || 0;
          const a0out = parseFloat(s.amount0_out) || 0;
          const isBuy = a0in > 0;
          return {
            hash: s.tx_hash,
            from: isBuy ? (pool?.token0_symbol || '?') : (pool?.token1_symbol || '?'),
            to: isBuy ? (pool?.token1_symbol || '?') : (pool?.token0_symbol || '?'),
            amountIn: formatNumber(isBuy ? a0in / 1e18 : a1in / 1e18),
            amountOut: formatNumber(isBuy ? a1out / 1e18 : a0out / 1e18),
            time: s.timestamp,
          };
        }));
      } catch {}
    };
    load();
  }, [showRecentTx, chainId]);

  useEffect(() => {
    setCurrentLocale(getLocale());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (txRef.current && !txRef.current.contains(e.target as Node)) {
        setShowRecentTx(false);
      }
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlertPanel(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = useCallback((newLocale: string) => {
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    setShowLangMenu(false);
    setShowMoreMenu(false);
    window.location.reload();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const closeAll = useCallback(() => {
    setShowLangMenu(false);
    setShowRecentTx(false);
    setShowAlertPanel(false);
    setShowMoreMenu(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full" style={{ height: 72 }}>
      <div
        className="absolute inset-0 backdrop-blur-[20px]"
        style={{
          background: 'var(--bg-base-alpha)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(240, 180, 41, 0.4), transparent)',
        }}
      />

      <div className="relative mx-auto px-2 sm:px-4 lg:px-6 h-full">
        <div className="flex h-full items-center justify-between gap-2">
          <Link
            href="/app/swap"
            className="flex items-center gap-1.5 shrink-0 group"
          >
            <svg
              width={32}
              height={32}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rounded-lg"
              aria-label="QsnDEX"
            >
              <defs>
                <linearGradient id="logo-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0F1629" />
                  <stop offset="100%" stopColor="#1A2540" />
                </linearGradient>
                <linearGradient id="logo-accent" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F0B429" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logo-bg)" />
              <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="url(#logo-accent)" strokeOpacity="0.3" />
              <path
                d="M16 7L22 11V15L16 19L10 15V11L16 7Z"
                stroke="url(#logo-accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M10 17L16 21L22 17V21L16 25L10 21V17Z"
                fill="url(#logo-accent)"
                fillOpacity="0.25"
                stroke="url(#logo-accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            <span className="text-lg font-bold font-[var(--font-heading)] leading-tight tracking-tight">
              <span className="text-white font-bold">Qsn</span>
              <span className="gradient-text font-bold">DEX</span>
            </span>
          </Link>

          <Navigation />

          <div className="flex items-center gap-1 2xl:gap-1.5 shrink-0">
            <div className="hidden 2xl:block">
              <ChainSwitcher />
            </div>

            <div ref={txRef} className="relative hidden 2xl:block">
              <button
                onClick={() => {
                  closeAll();
                  setShowRecentTx(!showRecentTx);
                }}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl',
                  'border transition-all duration-200',
                  showRecentTx
                    ? 'border-[var(--border-active)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)]'
                )}
                style={{ background: 'var(--bg-surface-alpha)' }}
                aria-label={t('header.recent_transactions')}
              >
                <Clock className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showRecentTx && (
                  <RecentTxDropdown txs={recentTxs} onClose={() => setShowRecentTx(false)} />
                )}
              </AnimatePresence>
            </div>

            {address && (
              <div ref={alertRef} className="relative hidden 2xl:block">
                <AlertBellButton
                  unreadCount={unreadCount}
                  active={showAlertPanel}
                  onClick={() => {
                    closeAll();
                    setShowAlertPanel(!showAlertPanel);
                  }}
                />
                <AnimatePresence>
                  {showAlertPanel && (
                    <AlertDropdown
                      notifications={notifications}
                      unreadCount={unreadCount}
                      address={address}
                      onDismiss={(id) => dismissAlertMut.mutate({ id, wallet: address })}
                      onClose={() => setShowAlertPanel(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            <div ref={langRef} className="relative hidden 2xl:block">
              <button
                onClick={() => {
                  closeAll();
                  setShowLangMenu(!showLangMenu);
                }}
                className={cn(
                  'flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-xl',
                  'border transition-all duration-200 text-xs font-semibold',
                  showLangMenu
                    ? 'border-[var(--border-active)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)]'
                )}
                style={{ background: 'var(--bg-surface-alpha)' }}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{locale}</span>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <LangDropdown locale={locale} onChange={handleLocaleChange} />
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className={cn(
                'hidden 2xl:flex items-center justify-center w-9 h-9 rounded-xl',
                'border transition-all duration-200',
                'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)]'
              )}
              style={{ background: 'var(--bg-surface-alpha)' }}
              aria-label={theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}
            >
              <ThemeIcon theme={theme} />
            </button>

            {address && (
              <div ref={alertRef} className="relative 2xl:hidden">
                <AlertBellButton
                  unreadCount={unreadCount}
                  active={showAlertPanel}
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowRecentTx(false);
                    setShowAlertPanel(!showAlertPanel);
                  }}
                />
                <AnimatePresence>
                  {showAlertPanel && (
                    <AlertDropdown
                      notifications={notifications}
                      unreadCount={unreadCount}
                      address={address}
                      onDismiss={(id) => dismissAlertMut.mutate({ id, wallet: address })}
                      onClose={() => setShowAlertPanel(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            <div ref={moreRef} className="relative 2xl:hidden">
              <button
                onClick={() => {
                  setShowAlertPanel(false);
                  setShowRecentTx(false);
                  setShowMoreMenu(!showMoreMenu);
                }}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl',
                  'border transition-all duration-200',
                  showMoreMenu
                    ? 'border-[var(--border-active)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)]'
                )}
                style={{ background: 'var(--bg-surface-alpha)' }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden py-1"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-xl)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="px-3 py-2">
                      <ChainSwitcher />
                    </div>
                    <div className="mx-3 my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />

                    <button
                      onClick={() => { toggleTheme(); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-surface-2)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}</span>
                    </button>

                    <div
                      className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {t('common.language') || 'Language'}
                    </div>
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'ru', label: 'Русский' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[var(--bg-surface-2)]',
                          locale === lang.code
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)]'
                        )}
                        style={locale === lang.code ? { background: 'rgba(240, 180, 41, 0.05)' } : undefined}
                      >
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">{lang.label}</span>
                      </button>
                    ))}

                    <div className="mx-3 my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowRecentTx(!showRecentTx);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-surface-2)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{t('header.recent_transactions')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showRecentTx && (
                  <div className="2xl:hidden absolute right-0 top-full mt-2 z-50">
                    <RecentTxDropdown txs={recentTxs} onClose={() => setShowRecentTx(false)} />
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden 2xl:block">
              <ConnectButton
                chainStatus="none"
                accountStatus="full"
                showBalance={true}
              />
            </div>
            <div className="2xl:hidden">
              <ConnectButton
                chainStatus="none"
                accountStatus="avatar"
                showBalance={false}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function AlertBellButton({ unreadCount, active, onClick }: { unreadCount: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-xl',
        'border transition-all duration-200',
        active
          ? 'border-[var(--border-active)] text-[var(--accent-warning)]'
          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)]'
      )}
      style={{ background: 'var(--bg-surface-alpha)' }}
      aria-label={t('alerts.notifications')}
    >
      {unreadCount > 0 ? (
        <BellRing className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 rounded-full text-[9px] font-bold px-1"
          style={{
            backgroundColor: 'var(--accent-danger)',
            color: '#fff',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

function AlertDropdown({ notifications, unreadCount, address, onDismiss, onClose }: {
  notifications: any[];
  unreadCount: number;
  address: string;
  onDismiss: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xl)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <BellRing className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
          {t('alerts.notifications')}
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 15%, transparent)',
                color: 'var(--accent-danger)',
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>
        <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('alerts.no_notifications')}
          </p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {notifications.map((notif) => {
            const condColor = notif.condition === 'above' ? 'var(--accent-tertiary)' : 'var(--accent-danger)';
            const CondIcon = notif.condition === 'above' ? TrendingUp : TrendingDown;
            return (
              <div
                key={notif.alert_id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-surface-2)] transition-colors"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)' }}
                >
                  <BellRing className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {notif.token_symbol}
                    </span>
                    <CondIcon className="w-3 h-3" style={{ color: condColor }} />
                    <span className="text-[10px] font-[var(--font-mono)]" style={{ color: condColor }}>
                      ${notif.target_price.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {t('alerts.current_price')}: ${notif.current_price.toFixed(4)}
                  </p>
                  {notif.note && (
                    <p className="text-[10px] italic mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {notif.note}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(notif.alert_id)}
                  className="p-1 rounded-md hover:opacity-80 shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                  title={t('alerts.dismiss')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <a
        href="/app/autopilot"
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors hover:opacity-80"
        style={{
          color: 'var(--accent-primary)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {t('alerts.view_all')}
      </a>
    </motion.div>
  );
}

function RecentTxDropdown({ txs, onClose }: { txs: any[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xl)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('header.recent_transactions')}
        </span>
        <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      {txs.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('header.no_recent_transactions')}
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {txs.map((tx, i) => (
            <a
              key={tx.hash || i}
              href={getExplorerUrl(tx.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-surface-2)] transition-colors"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {tx.amountIn} {tx.from} → {tx.amountOut} {tx.to}
                </span>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {tx.time ? new Date(tx.time).toLocaleTimeString() : ''}
                </p>
              </div>
              <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LangDropdown({ locale, onChange }: { locale: string; onChange: (code: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-36 rounded-xl overflow-hidden py-1 z-50"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xl)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {[
        { code: 'en', label: 'English' },
        { code: 'ru', label: 'Русский' },
      ].map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
            locale === lang.code
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
          style={locale === lang.code ? { background: 'rgba(240, 180, 41, 0.05)' } : undefined}
        >
          <span className="uppercase text-[10px] font-mono font-bold w-5">{lang.code}</span>
          <span className="font-medium">{lang.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

function ThemeIcon({ theme }: { theme: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {theme === 'dark' ? (
        <motion.div
          key="sun"
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-4 h-4" />
        </motion.div>
      ) : (
        <motion.div
          key="moon"
          initial={{ rotate: 90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: -90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-4 h-4" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
