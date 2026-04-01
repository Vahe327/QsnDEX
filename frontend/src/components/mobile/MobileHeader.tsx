'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/layout/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe, Bell, BellRing } from 'lucide-react';
import { MobileChainSelector } from './MobileChainSelector';
import { cn } from '@/lib/utils';
import { t, getLocale, setLocale } from '@/i18n';
import { useAccount } from 'wagmi';
import { useAlertCount } from '@/hooks/useAlerts';

export function MobileHeader() {
  const { theme, setTheme } = useTheme();
  const { address } = useAccount();
  const alertCount = useAlertCount(address);
  const unreadCount = alertCount.data ?? 0;
  const [locale, setCurrentLocale] = useState<string>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLocale(getLocale());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = useCallback((newLocale: string) => {
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    setShowLangMenu(false);
    window.location.reload();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        height: `calc(56px + env(safe-area-inset-top, 0px))`,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
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

      <div className="relative px-3 h-14 flex items-center justify-between gap-2">
        <Link href="/app/swap" className="flex items-center gap-1.5 shrink-0">
          <svg
            width={28}
            height={28}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="rounded-lg"
            aria-label="QsnDEX"
          >
            <defs>
              <linearGradient id="m-logo-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F1629" />
                <stop offset="100%" stopColor="#1A2540" />
              </linearGradient>
              <linearGradient id="m-logo-accent" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F0B429" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#m-logo-bg)" />
            <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="url(#m-logo-accent)" strokeOpacity="0.3" />
            <path
              d="M16 7L22 11V15L16 19L10 15V11L16 7Z"
              stroke="url(#m-logo-accent)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M10 17L16 21L22 17V21L16 25L10 21V17Z"
              fill="url(#m-logo-accent)"
              fillOpacity="0.25"
              stroke="url(#m-logo-accent)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-bold font-[var(--font-heading)] leading-tight tracking-tight">
            <span style={{ color: 'var(--text-primary)' }}>Qsn</span>
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DEX
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          {address && (
            <Link
              href="/app/autopilot"
              className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-xl',
                'border transition-all duration-200',
                'border-[var(--border-subtle)]',
              )}
              style={{ background: 'var(--bg-surface-alpha)' }}
            >
              {unreadCount > 0 ? (
                <BellRing className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
              ) : (
                <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
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
            </Link>
          )}

          <div ref={langRef} className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={cn(
                'flex items-center justify-center gap-1 h-9 px-2 rounded-xl',
                'border transition-all duration-200 text-xs font-semibold',
                showLangMenu
                  ? 'border-[var(--border-active)] text-[var(--accent-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
              )}
              style={{ background: 'var(--bg-surface-alpha)' }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{locale}</span>
            </button>

            <AnimatePresence>
              {showLangMenu && (
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
                  }}
                >
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'ru', label: 'Русский' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLocaleChange(lang.code)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors min-h-[44px]',
                        locale === lang.code
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)]'
                      )}
                      style={locale === lang.code ? { background: 'rgba(240, 180, 41, 0.05)' } : undefined}
                    >
                      <span className="uppercase text-[10px] font-mono font-bold w-5">{lang.code}</span>
                      <span className="font-medium">{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl',
              'border transition-all duration-200',
              'border-[var(--border-subtle)] text-[var(--text-secondary)]'
            )}
            style={{ background: 'var(--bg-surface-alpha)' }}
            aria-label={theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}
          >
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
          </button>

          <MobileChainSelector />
        </div>
      </div>
    </header>
  );
}
