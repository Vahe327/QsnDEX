'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Droplets,
  Layers,
  Shield,
  Sparkles,
  Wallet,
  Coins,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileNavItems: MobileNavItem[] = [
  { label: 'nav.swap', href: '/app/swap', icon: ArrowLeftRight },
  { label: 'nav.pools', href: '/app/pools', icon: Droplets },
  { label: 'nav.batch', href: '/app/batch', icon: Layers },
  { label: 'nav.safety', href: '/app/safety', icon: Shield },
  { label: 'nav.ai', href: '/app/ai', icon: Sparkles },
  { label: 'nav.staking', href: '/app/staking', icon: Coins },
  { label: 'nav.launchpad', href: '/app/launchpad', icon: Rocket },
  { label: 'nav.portfolio', href: '/app/portfolio', icon: Wallet },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        height: `calc(64px + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--bg-base-alpha)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] transition-colors duration-200',
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)] active:text-[var(--text-secondary)]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: 'var(--gradient-primary)' }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <motion.div
                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <span
                  className={cn('inline-flex', isActive && 'gradient-text')}
                  style={isActive ? {
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } : undefined}
                >
                  <Icon className="w-5 h-5" />
                </span>
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
      </div>
    </nav>
  );
}
