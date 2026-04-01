'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Sparkles,
  Wallet,
  Layers,
  Shield,
  Bot,
  Coins,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'nav.swap', href: '/app/swap', icon: ArrowLeftRight },
  { label: 'nav.pools', href: '/app/pools', icon: Droplets },
  { label: 'nav.batch', href: '/app/batch', icon: Layers },
  { label: 'nav.safety', href: '/app/safety', icon: Shield },
  { label: 'nav.analytics', href: '/app/analytics', icon: BarChart3 },
  { label: 'nav.ai', href: '/app/ai', icon: Sparkles },
  { label: 'nav.autopilot', href: '/app/autopilot', icon: Bot },
  { label: 'nav.staking', href: '/app/staking', icon: Coins },
  { label: 'nav.launchpad', href: '/app/launchpad', icon: Rocket },
  { label: 'nav.portfolio', href: '/app/portfolio', icon: Wallet },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden lg:flex items-center gap-0.5 rounded-2xl p-0.5"
      style={{
        background: 'var(--bg-surface-alpha)',
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors duration-200',
              isActive
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'rgba(240, 180, 41, 0.08)',
                  border: '1px solid var(--border-glow)',
                  boxShadow: 'var(--glow-gold)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            <Icon className="relative z-10 w-3.5 h-3.5" />

            <span className={cn('relative z-10', isActive && 'gradient-text')}>
              {t(item.label)}
            </span>

            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: 'var(--accent-primary)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
