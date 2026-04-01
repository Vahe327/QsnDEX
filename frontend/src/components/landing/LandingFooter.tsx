'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Twitter, MessageCircle, BookOpen, FileCode2 } from 'lucide-react';
import { t } from '@/i18n';

const productLinks = [
  { labelKey: 'landing.footer_swap', href: '/app/swap' },
  { labelKey: 'landing.footer_pools', href: '/app/pools' },
  { labelKey: 'landing.footer_analytics', href: '/app/analytics' },
  { labelKey: 'landing.footer_batch', href: '/app/batch' },
  { labelKey: 'landing.footer_safety', href: '/app/safety' },
  { labelKey: 'landing.footer_ai', href: '/app/ai' },
  { labelKey: 'landing.footer_staking', href: '/app/staking' },
  { labelKey: 'landing.footer_launchpad', href: '/app/launchpad' },
];

const resourceLinks = [
  { labelKey: 'landing.footer_docs', icon: BookOpen, href: '#', disabled: true },
  { labelKey: 'landing.footer_api', icon: FileCode2, href: '/swagger-ui', disabled: false },
];

const communityLinks = [
  { labelKey: 'landing.footer_github', icon: Github, href: '#', disabled: true },
  { labelKey: 'landing.footer_twitter', icon: Twitter, href: '#', disabled: true },
  { labelKey: 'landing.footer_discord', icon: MessageCircle, href: '#', disabled: true },
];

export function LandingFooter() {
  return (
    <footer className="relative px-4 pt-16 pb-10" style={{ background: '#050810' }}>
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(240,180,41,0.3), transparent)' }}
      />

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <svg
                width={28}
                height={28}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="rounded-lg"
              >
                <defs>
                  <linearGradient id="lfooter-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0F1629" />
                    <stop offset="100%" stopColor="#1A2540" />
                  </linearGradient>
                  <linearGradient id="lfooter-accent" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F0B429" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#lfooter-bg)" />
                <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="url(#lfooter-accent)" strokeOpacity="0.3" />
                <path d="M16 7L22 11V15L16 19L10 15V11L16 7Z" stroke="url(#lfooter-accent)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                <path d="M10 17L16 21L22 17V21L16 25L10 21V17Z" fill="url(#lfooter-accent)" fillOpacity="0.25" stroke="url(#lfooter-accent)" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
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
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'rgba(240,180,41,0.8)' }}>
              {t('landing.footer_product')}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-[#F0B429]"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'rgba(240,180,41,0.8)' }}>
              {t('landing.footer_resources')}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {resourceLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    {link.disabled ? (
                      <span
                        className="inline-flex items-center gap-2 text-sm opacity-40 cursor-not-allowed"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(link.labelKey)}
                      </span>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#F0B429]"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(link.labelKey)}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'rgba(240,180,41,0.8)' }}>
              {t('landing.footer_community')}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {communityLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    <span
                      className="inline-flex items-center gap-2 text-sm opacity-40 cursor-not-allowed"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t(link.labelKey)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div
          className="pt-6 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            &copy; {t('landing.footer_copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
