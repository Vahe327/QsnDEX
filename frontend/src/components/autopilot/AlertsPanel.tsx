'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  Pause,
  Play,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useChain } from '@/hooks/useChain';
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useToggleAlert,
  useDismissAlert,
} from '@/hooks/useAlerts';

interface AlertsPanelProps {
  className?: string;
  prefillToken?: string;
  prefillPrice?: string;
}

function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 0.01) {
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 8 });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('autopilot.just_now');
  if (mins < 60) return t('autopilot.minutes_ago', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('autopilot.hours_ago', { count: hours });
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function AlertsPanel({ className, prefillToken, prefillPrice }: AlertsPanelProps) {
  const { address } = useAccount();
  const { chainId } = useChain();
  const { data: alerts, isLoading } = useAlerts(address);
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const toggleAlert = useToggleAlert();
  const dismissAlert = useDismissAlert();

  const [showForm, setShowForm] = useState(!!prefillToken);
  const [tokenAddress, setTokenAddress] = useState(prefillToken || '');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState(prefillPrice || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showTriggered, setShowTriggered] = useState(true);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.tokenAddress) setTokenAddress(detail.tokenAddress);
        if (detail.tokenSymbol) setTokenSymbol(detail.tokenSymbol);
        if (detail.targetPrice) setTargetPrice(detail.targetPrice);
        if (detail.condition === 'above' || detail.condition === 'below') {
          setCondition(detail.condition);
        }
      }
      setShowForm(true);
      setError('');
    };
    window.addEventListener('open-alert-form', handler);
    return () => window.removeEventListener('open-alert-form', handler);
  }, []);

  useEffect(() => {
    if (prefillToken) {
      setTokenAddress(prefillToken);
      if (prefillPrice) setTargetPrice(prefillPrice);
      setShowForm(true);
    }
  }, [prefillToken, prefillPrice]);

  const resetForm = useCallback(() => {
    setTokenAddress('');
    setTokenSymbol('');
    setCondition('above');
    setTargetPrice('');
    setNote('');
    setError('');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!address) return;
    setError('');

    const price = parseFloat(targetPrice);
    if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
      setError(t('alerts.error_create'));
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError(t('alerts.error_create'));
      return;
    }

    createAlert.mutate(
      {
        wallet: address,
        token_address: tokenAddress,
        token_symbol: tokenSymbol || undefined,
        condition,
        target_price: price,
        note: note || undefined,
        chain_id: chainId,
      },
      {
        onSuccess: () => {
          resetForm();
          setShowForm(false);
        },
        onError: (err: any) => {
          setError(err?.message || t('alerts.error_create'));
        },
      },
    );
  }, [address, tokenAddress, tokenSymbol, condition, targetPrice, note, chainId, createAlert, resetForm]);

  const activeAlerts = alerts?.filter((a) => a.active && !a.triggered) || [];
  const triggeredAlerts = alerts?.filter((a) => a.triggered) || [];
  const pausedAlerts = alerts?.filter((a) => !a.active && !a.triggered) || [];
  const displayAlerts = showTriggered
    ? [...triggeredAlerts, ...activeAlerts, ...pausedAlerts]
    : activeAlerts;

  return (
    <div id="alerts-panel" className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)',
            }}
          >
            <Bell size={18} style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('alerts.title')}
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {t('alerts.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
            color: 'var(--accent-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? '' : t('alerts.create_title')}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="card p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col gap-3">
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('alerts.create_title')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {t('alerts.token_address')}
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value.trim())}
                    placeholder={t('alerts.token_address_placeholder')}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {t('alerts.token_symbol')}
                  </label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().trim())}
                    placeholder={t('alerts.token_symbol_placeholder')}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {t('alerts.condition')}
                  </label>
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => setCondition('above')}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: condition === 'above'
                          ? 'color-mix(in srgb, var(--accent-tertiary) 18%, transparent)'
                          : 'var(--bg-input)',
                        color: condition === 'above' ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                      }}
                    >
                      <TrendingUp size={12} />
                      {t('alerts.condition_above')}
                    </button>
                    <button
                      onClick={() => setCondition('below')}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: condition === 'below'
                          ? 'color-mix(in srgb, var(--accent-danger) 18%, transparent)'
                          : 'var(--bg-input)',
                        color: condition === 'below' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                      }}
                    >
                      <TrendingDown size={12} />
                      {t('alerts.condition_below')}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {t('alerts.target_price')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={t('alerts.target_price_placeholder')}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors font-[var(--font-mono)]"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('alerts.note')}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('alerts.note_placeholder')}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                />
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
                    color: 'var(--accent-danger)',
                    border: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)',
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={createAlert.isPending || !tokenAddress || !targetPrice}
                className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))',
                  color: '#000',
                  boxShadow: '0 4px 12px rgba(240, 180, 41, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <Bell size={14} />
                {createAlert.isPending ? t('alerts.creating') : t('alerts.create_button')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-semibold flex items-center gap-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <BellRing size={14} style={{ color: 'var(--accent-warning)' }} />
            {t('alerts.my_alerts')}
            {alerts && alerts.length > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                  color: 'var(--accent-primary)',
                }}
              >
                {alerts.length}
              </span>
            )}
          </h3>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showTriggered}
              onChange={(e) => setShowTriggered(e.target.checked)}
              className="accent-[var(--accent-primary)] w-3.5 h-3.5"
            />
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {t('alerts.include_triggered')}
            </span>
          </label>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl h-20"
                style={{ backgroundColor: 'var(--bg-surface-2)' }}
              />
            ))}
          </div>
        )}

        {!isLoading && displayAlerts.length === 0 && (
          <div
            className="card flex items-center justify-center py-8"
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('alerts.no_alerts')}
            </p>
          </div>
        )}

        <AnimatePresence>
          {displayAlerts.map((alert, idx) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              index={idx}
              onDelete={() => address && deleteAlert.mutate({ id: alert.id, wallet: address })}
              onToggle={() => address && toggleAlert.mutate({ id: alert.id, wallet: address })}
              onDismiss={() => address && dismissAlert.mutate({ id: alert.id, wallet: address })}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface AlertRowProps {
  alert: {
    id: number;
    token_symbol: string;
    token_address: string;
    condition: string;
    target_price: number;
    price_at_creation: number;
    current_price: number | null;
    active: boolean;
    triggered: boolean;
    note: string;
    created_at: string;
    triggered_at: string | null;
  };
  index: number;
  onDelete: () => void;
  onToggle: () => void;
  onDismiss: () => void;
}

function AlertRow({ alert, index, onDelete, onToggle, onDismiss }: AlertRowProps) {
  const statusColor = alert.triggered
    ? 'var(--accent-warning)'
    : alert.active
      ? 'var(--accent-tertiary)'
      : 'var(--text-tertiary)';

  const statusLabel = alert.triggered
    ? t('alerts.triggered')
    : alert.active
      ? t('alerts.active')
      : t('alerts.paused');

  const CondIcon = alert.condition === 'above' ? TrendingUp : TrendingDown;
  const condColor = alert.condition === 'above' ? 'var(--accent-tertiary)' : 'var(--accent-danger)';

  return (
    <motion.div
      className="card relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      layout
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: statusColor }}
      />

      <div className="p-3.5 pl-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {alert.token_symbol || alert.token_address.slice(0, 10)}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                color: statusColor,
              }}
            >
              {alert.triggered && <BellRing size={10} />}
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {alert.triggered && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-md transition-colors hover:opacity-80"
                style={{ color: 'var(--accent-warning)' }}
                title={t('alerts.dismiss')}
              >
                <Eye size={14} />
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
              title={alert.active ? t('alerts.pause') : t('alerts.resume')}
            >
              {alert.active ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ color: 'var(--accent-danger)' }}
              title={t('alerts.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <CondIcon size={12} style={{ color: condColor }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {alert.condition === 'above' ? t('alerts.when_above') : t('alerts.when_below')}
            </span>
            <span
              className="text-xs font-bold font-[var(--font-mono)]"
              style={{ color: condColor }}
            >
              {formatPrice(alert.target_price)}
            </span>
          </div>

          {alert.current_price != null && (
            <div className="flex items-center gap-1">
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {t('alerts.current_price')}:
              </span>
              <span
                className="text-xs font-semibold font-[var(--font-mono)]"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatPrice(alert.current_price)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock size={10} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {timeAgo(alert.created_at)}
            </span>
          </div>
        </div>

        {alert.note && (
          <p className="text-[11px] italic" style={{ color: 'var(--text-secondary)' }}>
            {alert.note}
          </p>
        )}

        {alert.triggered && alert.triggered_at && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
              color: 'var(--accent-warning)',
            }}
          >
            <BellRing size={10} />
            {t('alerts.alert_triggered')} {timeAgo(alert.triggered_at)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
