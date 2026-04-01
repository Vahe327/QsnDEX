'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { MoreMenu } from './MoreMenu';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'nav.swap', href: '/app/swap', icon: ArrowLeftRight },
  { label: 'nav.pools', href: '/app/pools', icon: Droplets },
  { label: 'nav.analytics', href: '/app/analytics', icon: BarChart3 },
  { label: 'nav.portfolio', href: '/app/portfolio', icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = [
    '/app/batch',
    '/app/safety',
    '/app/ai',
    '/app/staking',
    '/app/launchpad',
    '/app/autopilot',
    '/app/farms',
  ].some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: `calc(64px + env(safe-area-inset-bottom, 0px))`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--bg-base-alpha)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-around px-1 h-16">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px] min-h-[44px] transition-colors duration-200',
                  isActive
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-tertiary)] active:text-[var(--text-secondary)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="m-bottom-nav-active"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: 'var(--gradient-primary)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                <span className="text-[10px] font-medium leading-none">
                  {t(item.label)}
                </span>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(240, 180, 41, 0.05)' }}
                  />
                )}
              </Link>
            );
          })}

          <button
            onClick={() => setShowMore(true)}
            className={cn(
              'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px] min-h-[44px] transition-colors duration-200',
              isMoreActive
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-tertiary)] active:text-[var(--text-secondary)]'
            )}
          >
            {isMoreActive && (
              <motion.div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
              />
            )}
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">
              {t('mobile.more')}
            </span>
            {isMoreActive && (
              <div
                className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(240, 180, 41, 0.05)' }}
              />
            )}
          </button>
        </div>
      </nav>

      <MoreMenu open={showMore} onClose={() => setShowMore(false)} />
    </>
  );
}
