'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  layoutId = 'tab-pill',
}: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-[14px]',
        'bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-subtle)]',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-4 py-2 rounded-[10px] text-sm font-medium transition-colors flex items-center gap-2',
              isActive
                ? 'text-[var(--bg-deep)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:brightness-125',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-[10px]"
                style={{ background: 'linear-gradient(135deg, #F0B429, #D97706)', boxShadow: '0 0 16px rgba(240,180,41,0.3)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
