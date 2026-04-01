'use client';

import { motion } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Modal } from './Modal';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { getExplorerUrl } from '@/lib/formatters';

export type TransactionStatus =
  | 'waiting_approval'
  | 'waiting_confirmation'
  | 'pending'
  | 'success'
  | 'failed'
  | 'rejected';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txHash?: string;
  tokenSymbol?: string;
  title?: string;
  onRetry?: () => void;
}

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
  glowColor: string;
}

function getStatusConfig(status: TransactionStatus, tokenSymbol?: string): StatusConfig {
  switch (status) {
    case 'waiting_approval':
      return {
        icon: <Clock size={48} />,
        title: t('tx.waiting_approval', { symbol: tokenSymbol || '' }),
        description: t('tx.waiting_approval_desc'),
        colorClass: 'text-[var(--accent-warning)]',
        glowColor: 'rgba(255,184,0,0.2)',
      };
    case 'waiting_confirmation':
      return {
        icon: <Clock size={48} />,
        title: t('tx.waiting_confirm'),
        description: t('tx.waiting_confirm_desc'),
        colorClass: 'text-[var(--accent-primary)]',
        glowColor: 'rgba(0,229,255,0.2)',
      };
    case 'pending':
      return {
        icon: <Loader2 size={48} className="animate-spin" />,
        title: t('tx.pending'),
        description: t('tx.pending_desc'),
        colorClass: 'text-[var(--accent-primary)]',
        glowColor: 'rgba(0,229,255,0.2)',
      };
    case 'success':
      return {
        icon: <CheckCircle2 size={48} />,
        title: t('tx.success'),
        description: t('tx.success_desc'),
        colorClass: 'text-[var(--accent-tertiary)]',
        glowColor: 'rgba(0,255,163,0.25)',
      };
    case 'failed':
      return {
        icon: <XCircle size={48} />,
        title: t('tx.failed'),
        description: t('tx.failed_desc'),
        colorClass: 'text-[var(--accent-danger)]',
        glowColor: 'rgba(255,59,92,0.2)',
      };
    case 'rejected':
      return {
        icon: <AlertTriangle size={48} />,
        title: t('tx.rejected'),
        description: t('tx.rejected_desc'),
        colorClass: 'text-[var(--accent-warning)]',
        glowColor: 'rgba(255,184,0,0.2)',
      };
  }
}

const spinnerVariants = {
  animate: { rotate: 360 },
  transition: { repeat: Infinity, duration: 2, ease: 'linear' as const },
};

const pulseVariants = {
  animate: { scale: [1, 1.1, 1] },
  transition: { repeat: Infinity, duration: 1.5 },
};

const bounceVariants = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 15 },
};

function getAnimation(status: TransactionStatus) {
  switch (status) {
    case 'pending':
      return spinnerVariants;
    case 'waiting_approval':
    case 'waiting_confirmation':
      return pulseVariants;
    case 'success':
    case 'failed':
    case 'rejected':
      return bounceVariants;
  }
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  txHash,
  tokenSymbol,
  title,
  onRetry,
}: TransactionModalProps) {
  const config = getStatusConfig(status, tokenSymbol);
  const anim = getAnimation(status);
  const canClose = status === 'success' || status === 'failed' || status === 'rejected';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showClose={canClose}
      maxWidth="sm"
    >
      <div className="flex flex-col items-center py-6 gap-4">
        <motion.div
          className={cn(config.colorClass, 'relative')}
          {...anim}
        >
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-60"
            style={{ background: config.glowColor }}
          />
          <div className="relative">{config.icon}</div>
        </motion.div>

        <div className="text-center">
          <h4 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {config.title}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-[280px]">
            {config.description}
          </p>
        </div>

        {txHash && (
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 text-sm font-medium text-[var(--accent-primary)]',
              'hover:text-[var(--accent-primary)]/80 transition-colors',
            )}
          >
            {t('tx.view_on_explorer')}
            <ExternalLink size={14} />
          </a>
        )}

        {canClose && (
          <div className="flex gap-3 w-full mt-2">
            {(status === 'failed' || status === 'rejected') && onRetry && (
              <button onClick={onRetry} className="btn-primary flex-1">
                {t('tx.try_again')}
              </button>
            )}
            <button
              onClick={onClose}
              className={cn(
                'flex-1 flex items-center justify-center',
                (status === 'failed' || status === 'rejected') ? 'btn-secondary' : 'btn-primary',
              )}
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
