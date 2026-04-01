'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Droplets,
  TrendingUp,
  TrendingDown,
  Bell,
  ArrowRight,
  ShieldAlert,
  Flame,
  Snowflake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface SuggestionAction {
  action_type: string;
  from_token?: string;
  from_symbol?: string;
  to_token?: string;
  to_symbol?: string;
  suggested_amount?: string;
  suggested_pct?: number;
  pool_address?: string;
  pool_name?: string;
  apr?: number;
  estimated_monthly?: number;
  token_symbol?: string;
  token_address?: string;
  condition?: string;
  target_price?: number;
}

interface Suggestion {
  id: string;
  suggestion_type: string;
  priority: string;
  title: string;
  description: string;
  action: SuggestionAction;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  className?: string;
}

const PRIORITY_CONFIG: Record<string, { color: string; borderColor: string; labelKey: string }> = {
  high: {
    color: 'var(--accent-danger)',
    borderColor: '#EF4444',
    labelKey: 'autopilot.priority_high',
  },
  medium: {
    color: 'var(--accent-warning)',
    borderColor: '#FFB800',
    labelKey: 'autopilot.priority_medium',
  },
  low: {
    color: 'var(--accent-primary)',
    borderColor: 'var(--accent-primary)',
    labelKey: 'autopilot.priority_low',
  },
};

type IconComponent = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

const PRIORITY_ICONS: Record<string, IconComponent> = {
  high: Flame,
  medium: ShieldAlert,
  low: Snowflake,
};

const TYPE_ICONS: Record<string, IconComponent> = {
  diversify: AlertTriangle,
  earn_yield: Droplets,
  take_profit: TrendingUp,
  cut_loss: TrendingDown,
  set_alert: Bell,
};

function buildActionLink(suggestion: Suggestion): string {
  const { suggestion_type, action } = suggestion;

  switch (suggestion_type) {
    case 'diversify': {
      const params = new URLSearchParams();
      if (action.from_token) params.set('from', action.from_token);
      if (action.to_token) params.set('to', action.to_token);
      if (action.suggested_amount) params.set('amount', action.suggested_amount);
      return `/app/swap?${params.toString()}`;
    }
    case 'earn_yield': {
      if (action.pool_address) {
        return `/app/pools/add?pool=${action.pool_address}`;
      }
      return '/app/pools';
    }
    case 'take_profit': {
      const params = new URLSearchParams();
      if (action.from_token) params.set('from', action.from_token);
      if (action.to_token) params.set('to', action.to_token);
      return `/app/swap?${params.toString()}`;
    }
    case 'cut_loss': {
      const params = new URLSearchParams();
      if (action.from_token) params.set('from', action.from_token);
      if (action.to_token) params.set('to', action.to_token);
      return `/app/swap?${params.toString()}`;
    }
    case 'set_alert': {
      const params = new URLSearchParams();
      if (action.token_address) params.set('token', action.token_address);
      if (action.target_price) params.set('price', String(action.target_price));
      return `/app/autopilot?${params.toString()}`;
    }
    default:
      return '/app/swap';
  }
}

function getActionLabelKey(type: string): string {
  switch (type) {
    case 'diversify':
      return 'autopilot.action_diversify';
    case 'earn_yield':
      return 'autopilot.action_earn_yield';
    case 'take_profit':
      return 'autopilot.action_take_profit';
    case 'cut_loss':
      return 'autopilot.action_cut_loss';
    case 'set_alert':
      return 'autopilot.action_set_alert';
    default:
      return 'autopilot.action_view';
  }
}

export function SuggestionCard({ suggestion, className }: SuggestionCardProps) {
  const priorityConfig = PRIORITY_CONFIG[suggestion.priority] ?? PRIORITY_CONFIG.low;
  const PriorityIcon = PRIORITY_ICONS[suggestion.priority] ?? ShieldAlert;
  const TypeIcon = TYPE_ICONS[suggestion.suggestion_type] ?? AlertTriangle;
  const actionLink = useMemo(() => buildActionLink(suggestion), [suggestion]);
  const actionLabelKey = getActionLabelKey(suggestion.suggestion_type);
  const router = useRouter();

  const isSetAlert = suggestion.suggestion_type === 'set_alert';

  const handleSetAlert = useCallback(() => {
    const detail = {
      tokenAddress: suggestion.action.token_address || '',
      tokenSymbol: suggestion.action.token_symbol || '',
      targetPrice: suggestion.action.target_price ? String(suggestion.action.target_price) : '',
      condition: suggestion.action.condition?.toLowerCase().includes('above') ? 'above' : 'below',
    };
    window.dispatchEvent(new CustomEvent('open-alert-form', { detail }));
    const el = document.getElementById('alerts-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [suggestion]);

  return (
    <motion.div
      className={cn(
        'card',
        'relative',
        'transition-shadow duration-300',
        'hover:shadow-[0_0_24px_rgba(255,255,255,0.06)]',
        className,
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.01 }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: priorityConfig.borderColor }}
      />

      <div className="p-4 pl-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${priorityConfig.borderColor} 15%, transparent)`,
              color: priorityConfig.color,
              textShadow: `0 0 10px ${priorityConfig.borderColor}50, 0 1px 2px rgba(0,0,0,0.5)`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(0,0,0,0.15)',
            }}
          >
            <PriorityIcon size={12} />
            <span>{t(priorityConfig.labelKey)}</span>
          </div>
          <TypeIcon
            size={18}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h3
            className="text-sm font-semibold leading-snug"
            style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
          >
            {suggestion.title}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
          >
            {suggestion.description}
          </p>
        </div>

        {suggestion.action.apr != null && (
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent-tertiary)', textShadow: '0 0 10px rgba(16,185,129,0.4), 0 1px 2px rgba(0,0,0,0.5)' }}
          >
            <TrendingUp size={12} />
            <span>{t('autopilot.apr_label', { apr: suggestion.action.apr.toFixed(1) })}</span>
            {suggestion.action.estimated_monthly != null && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {' '}
                &middot; ~${suggestion.action.estimated_monthly.toFixed(2)}/{t('autopilot.month')}
              </span>
            )}
          </div>
        )}

        {isSetAlert ? (
          <button
            onClick={handleSetAlert}
            className={cn(
              'flex items-center justify-center gap-2',
              'w-full rounded-lg py-2 px-3',
              'text-sm font-semibold',
              'transition-all duration-200',
              'hover:brightness-110 active:scale-[0.98]',
              'cursor-pointer',
            )}
            style={{
              backgroundColor: `color-mix(in srgb, ${priorityConfig.borderColor} 18%, transparent)`,
              color: priorityConfig.color,
              textShadow: `0 0 8px ${priorityConfig.borderColor}40, 0 1px 2px rgba(0,0,0,0.4)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(0,0,0,0.12)',
            }}
          >
            <span>{t(actionLabelKey)}</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <Link
            href={actionLink}
            className={cn(
              'flex items-center justify-center gap-2',
              'w-full rounded-lg py-2 px-3',
              'text-sm font-semibold',
              'transition-all duration-200',
              'hover:brightness-110 active:scale-[0.98]',
            )}
            style={{
              backgroundColor: `color-mix(in srgb, ${priorityConfig.borderColor} 18%, transparent)`,
              color: priorityConfig.color,
              textShadow: `0 0 8px ${priorityConfig.borderColor}40, 0 1px 2px rgba(0,0,0,0.4)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(0,0,0,0.12)',
            }}
          >
            <span>{t(actionLabelKey)}</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
