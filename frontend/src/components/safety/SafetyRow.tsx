'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface CheckResult {
  name: string;
  status: string;
  severity: string;
  detail: string;
}

interface SafetyRowProps {
  check: CheckResult;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#10B981' }} />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#FFB800' }} />;
    case 'fail':
      return <XCircle className="w-5 h-5 shrink-0" style={{ color: '#EF4444' }} />;
    default:
      return <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--text-secondary)' }} />;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pass':
      return '#10B981';
    case 'warning':
      return '#D97706';
    case 'fail':
      return '#EF4444';
    default:
      return 'var(--text-secondary)';
  }
}

function getStatusLabelKey(status: string): string {
  switch (status) {
    case 'pass':
      return 'safety.status_pass';
    case 'warning':
      return 'safety.status_warning';
    case 'fail':
      return 'safety.status_fail';
    default:
      return 'safety.status_unknown';
  }
}

export function SafetyRow({ check }: SafetyRowProps) {
  const statusColor = getStatusColor(check.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
        'bg-[var(--bg-surface)]/60 backdrop-blur-md',
        'border border-[var(--border-subtle)]',
        'hover:border-[color:var(--accent-primary)]/20 hover:bg-[var(--bg-surface-2)]/50',
        'group cursor-default'
      )}
    >
      <div className="mt-0.5">
        {getStatusIcon(check.status)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {t(`safety.${check.name}`)}
          </span>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
              'border backdrop-blur-sm'
            )}
            style={{
              color: statusColor,
              backgroundColor: `${statusColor}12`,
              borderColor: `${statusColor}25`,
            }}
          >
            {t(getStatusLabelKey(check.status))}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
          {check.detail}
        </p>
      </div>
    </motion.div>
  );
}
