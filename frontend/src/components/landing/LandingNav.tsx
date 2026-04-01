'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { t, getLocale, setLocale } from '@/i18n';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [locale, setCurrentLocale] = useState('en');
  const [showLang, setShowLang] = useState(false);

  useEffect(() => {
    setCurrentLocale(getLocale());
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLocaleChange = useCallback((newLocale: string) => {
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    setShowLang(false);
    window.location.reload();
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[rgba(5,8,16,0.85)] backdrop-blur-xl border-b border-[rgba(240,180,41,0.1)]'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
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
                <linearGradient id="lnav-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0F1629" />
                  <stop offset="100%" stopColor="#1A2540" />
                </linearGradient>
                <linearGradient id="lnav-accent" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F0B429" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#lnav-bg)" />
              <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="url(#lnav-accent)" strokeOpacity="0.3" />
              <path
                d="M16 7L22 11V15L16 19L10 15V11L16 7Z"
                stroke="url(#lnav-accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M10 17L16 21L22 17V21L16 25L10 21V17Z"
                fill="url(#lnav-accent)"
                fillOpacity="0.25"
                stroke="url(#lnav-accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="text-white">Qsn</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #F0B429, #D97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                DEX
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowLang(!showLang)}
                className={cn(
                  'flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-semibold',
                  'border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]',
                  'hover:text-white hover:border-[rgba(240,180,41,0.3)] transition-all duration-200'
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{locale}</span>
              </button>

              {showLang && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-36 rounded-xl overflow-hidden py-1 bg-[#14161E] border border-[rgba(255,255,255,0.1)]"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'ru', label: 'Русский' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLocaleChange(lang.code)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                        locale === lang.code
                          ? 'text-[#F0B429]'
                          : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                      )}
                      style={locale === lang.code ? { background: 'rgba(240,180,41,0.05)' } : undefined}
                    >
                      <span className="uppercase text-[10px] font-mono font-bold w-5">{lang.code}</span>
                      <span className="font-medium">{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <Link
              href="/app"
              className={cn(
                'inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold',
                'transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]'
              )}
              style={{
                background: 'linear-gradient(135deg, #F0B429, #D97706)',
                color: '#050810',
                boxShadow: '0 0 20px rgba(240,180,41,0.25), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <span>{t('landing.nav_launch')}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
