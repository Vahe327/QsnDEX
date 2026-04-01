'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Layers,
  Shield,
  Sparkles,
  Coins,
  Rocket,
  Bot,
  Tractor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { MobileBottomSheet } from './MobileBottomSheet';

interface MoreMenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const menuItems: MoreMenuItem[] = [
  {
    label: 'nav.batch',
    href: '/app/batch',
    icon: Layers,
    description: 'mobile.more_batch_desc',
  },
  {
    label: 'nav.safety',
    href: '/app/safety',
    icon: Shield,
    description: 'mobile.more_safety_desc',
  },
  {
    label: 'nav.ai',
    href: '/app/ai',
    icon: Sparkles,
    description: 'mobile.more_ai_desc',
  },
  {
    label: 'nav.staking',
    href: '/app/staking',
    icon: Coins,
    description: 'mobile.more_staking_desc',
  },
  {
    label: 'nav.launchpad',
    href: '/app/launchpad',
    icon: Rocket,
    description: 'mobile.more_launchpad_desc',
  },
  {
    label: 'nav.autopilot',
    href: '/app/autopilot',
    icon: Bot,
    description: 'mobile.more_autopilot_desc',
  },
  {
    label: 'nav.farms',
    href: '/app/farms',
    icon: Tractor,
    description: 'mobile.more_farms_desc',
  },
];

interface MoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <MobileBottomSheet open={open} onClose={onClose} title={t('mobile.more')}>
      <div className="px-4 py-3 grid grid-cols-1 gap-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <button
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-2xl min-h-[56px] text-left transition-all duration-200',
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-primary)] active:scale-[0.98]'
              )}
              style={{
                background: isActive
                  ? 'var(--gradient-glow)'
                  : 'var(--bg-surface-2)',
                border: isActive
                  ? '1px solid var(--border-active)'
                  : '1px solid transparent',
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{
                  background: isActive
                    ? 'var(--gradient-primary)'
                    : 'var(--bg-surface-3)',
                }}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[var(--text-secondary)]')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{t(item.label)}</div>
                <div
                  className="text-xs mt-0.5 truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t(item.description)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </MobileBottomSheet>
  );
}
