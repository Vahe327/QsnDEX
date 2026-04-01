'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { t } from '@/i18n';
import { getExplorerUrl } from '@/lib/formatters';
import { MobileBottomSheet } from './MobileBottomSheet';

type TxStatus = 'pending' | 'success' | 'failed';

interface MobileTransactionModalProps {
  open: boolean;
  onClose: () => void;
  status: TxStatus;
  txHash?: string;
  title?: string;
  description?: string;
}

const statusConfig: Record<TxStatus, { icon: React.ReactNode; color: string }> = {
  pending: {
    icon: <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--accent-primary)' }} />,
    color: 'var(--accent-primary)',
  },
  success: {
    icon: <CheckCircle2 className="w-12 h-12" style={{ color: 'var(--accent-tertiary)' }} />,
    color: 'var(--accent-tertiary)',
  },
  failed: {
    icon: <XCircle className="w-12 h-12" style={{ color: 'var(--accent-danger)' }} />,
    color: 'var(--accent-danger)',
  },
};

export function MobileTransactionModal({
  open,
  onClose,
  status,
  txHash,
  title,
  description,
}: MobileTransactionModalProps) {
  const config = statusConfig[status];

  const defaultTitle =
    status === 'pending'
      ? t('tx.pending')
      : status === 'success'
        ? t('tx.success')
        : t('tx.failed');

  const defaultDesc =
    status === 'pending'
      ? t('tx.pending_desc')
      : status === 'success'
        ? t('tx.success_desc')
        : t('tx.failed_desc');

  return (
    <MobileBottomSheet open={open} onClose={onClose} showClose={status !== 'pending'}>
      <div className="px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mb-4"
        >
          {config.icon}
        </motion.div>

        <h3
          className="text-lg font-bold font-[var(--font-heading)] mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {title || defaultTitle}
        </h3>

        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {description || defaultDesc}
        </p>

        {txHash && (
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] transition-all"
            style={{
              color: 'var(--accent-primary)',
              background: 'var(--gradient-glow)',
              border: '1px solid var(--border-glow)',
            }}
          >
            <ExternalLink className="w-4 h-4" />
            {t('tx.view_on_explorer')}
          </a>
        )}

        {status !== 'pending' && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-all"
            style={{
              background: status === 'success' ? 'var(--gradient-primary)' : 'var(--bg-surface-2)',
              color: status === 'success' ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {status === 'failed' ? t('tx.try_again') : t('common.close')}
          </button>
        )}
      </div>
    </MobileBottomSheet>
  );
}
