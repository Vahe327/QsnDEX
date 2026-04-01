'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Wallet,
  RefreshCw,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Droplets,
  Bell,
  BellRing,
  Loader2,
  Info,
  Clock,
  Plus,
  X,
  Trash2,
  Pause,
  Play,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatUSD } from '@/lib/formatters';
import { useAutopilot } from '@/hooks/useAutopilot';
import { useChain } from '@/hooks/useChain';
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useToggleAlert,
  useDismissAlert,
} from '@/hooks/useAlerts';

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  diversify: ArrowRightLeft,
  earn_yield: Droplets,
  take_profit: TrendingUp,
  cut_loss: TrendingDown,
  set_alert: Bell,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--accent-danger)',
  medium: 'var(--accent-warning)',
  low: 'var(--accent-tertiary)',
};

interface MobileAutopilotProps {
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

export function MobileAutopilot({ prefillToken, prefillPrice }: MobileAutopilotProps) {
  const { address, isConnected } = useAccount();
  const { data, isLoading, error, refetch } = useAutopilot(address);

  const suggestions = data?.suggestions ?? [];
  const healthScore = data?.health_score ?? 0;
  const portfolioValue = data?.portfolio_value_usd ?? 0;
  const cached = data?.cached ?? false;
  const lastScanned = data?.scanned_at ? new Date(data.scanned_at).toLocaleString() : null;

  const healthStatus =
    healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'needs_attention' : 'at_risk';

  const healthColor =
    healthScore >= 80
      ? 'var(--accent-tertiary)'
      : healthScore >= 50
        ? 'var(--accent-warning)'
        : 'var(--accent-danger)';

  if (!isConnected) {
    return (
      <div className="px-3 pt-3 pb-4">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(240,180,41,0.04))' }}
          >
            <Wallet className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('autopilot.connect_wallet_title')}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('autopilot.connect_wallet_desc')}
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))' }}
          >
            <Bot className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold font-[var(--font-heading)]" style={{ color: 'var(--text-primary)' }}>
              {t('autopilot.title')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('autopilot.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs min-h-[36px]"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--accent-primary)' }}
        >
          <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
          {t('autopilot.rescan')}
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('autopilot.scanning')}
            </p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('autopilot.error_loading')}
          </p>
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-3">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {t('autopilot.portfolio_value')}
                </div>
                <div className="text-xl font-bold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                  {formatUSD(portfolioValue)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-2xl font-bold font-[var(--font-mono)]"
                  style={{ color: healthColor }}
                >
                  {healthScore}
                </div>
                <div className="text-[10px] font-semibold" style={{ color: healthColor }}>
                  {t(`autopilot.${healthStatus}`)}
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${healthScore}%`, background: healthColor }}
              />
            </div>
            {cached && lastScanned && (
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {t('autopilot.last_scan')}: {lastScanned}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('autopilot.suggestions_title', { count: suggestions.length })}
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('autopilot.no_suggestions')}
              </p>
            </div>
          ) : (
            suggestions.map((suggestion: any, i: number) => {
              const Icon = ACTION_ICONS[suggestion.suggestion_type] || Bot;
              const priorityColor = PRIORITY_COLORS[suggestion.priority] || 'var(--text-tertiary)';

              return (
                <motion.div
                  key={suggestion.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                      style={{ background: `color-mix(in srgb, ${priorityColor} 12%, transparent)` }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {suggestion.title}
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            color: priorityColor,
                            background: `color-mix(in srgb, ${priorityColor} 10%, transparent)`,
                          }}
                        >
                          {t(`autopilot.priority_${suggestion.priority}`)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {suggestion.description}
                      </p>
                      {suggestion.action && (
                        <button
                          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[32px]"
                          style={{
                            background: `color-mix(in srgb, ${priorityColor} 12%, transparent)`,
                            color: priorityColor,
                            border: `1px solid color-mix(in srgb, ${priorityColor} 20%, transparent)`,
                          }}
                        >
                          {t(`autopilot.action_${suggestion.suggestion_type}`)}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          <div className="flex items-start gap-2 px-1 pt-2">
            <Info className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-[9px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {t('autopilot.disclaimer')}
            </p>
          </div>
        </div>
      )}

      {isConnected && address && (
        <MobileAlertsSection
          address={address}
          prefillToken={prefillToken}
          prefillPrice={prefillPrice}
        />
      )}
    </div>
  );
}

interface MobileAlertsSectionProps {
  address: string;
  prefillToken?: string;
  prefillPrice?: string;
}

function MobileAlertsSection({ address, prefillToken, prefillPrice }: MobileAlertsSectionProps) {
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
  const [formError, setFormError] = useState('');

  const resetForm = useCallback(() => {
    setTokenAddress('');
    setTokenSymbol('');
    setCondition('above');
    setTargetPrice('');
    setNote('');
    setFormError('');
  }, []);

  const handleCreate = useCallback(async () => {
    setFormError('');
    const price = parseFloat(targetPrice);
    if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
      setFormError(t('alerts.error_create'));
      return;
    }
    if (isNaN(price) || price <= 0) {
      setFormError(t('alerts.error_create'));
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
          setFormError(err?.message || t('alerts.error_create'));
        },
      },
    );
  }, [address, tokenAddress, tokenSymbol, condition, targetPrice, note, chainId, createAlert, resetForm]);

  const displayAlerts = alerts || [];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' }}
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('alerts.title')}
            </span>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {t('alerts.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
            color: 'var(--accent-primary)',
          }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('alerts.create_title')}
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('alerts.token_address')}
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value.trim())}
                placeholder={t('alerts.token_address_placeholder')}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
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
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('alerts.condition')}
              </label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setCondition('above')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold min-h-[40px]"
                  style={{
                    backgroundColor: condition === 'above'
                      ? 'color-mix(in srgb, var(--accent-tertiary) 18%, transparent)'
                      : 'var(--bg-input)',
                    color: condition === 'above' ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                  }}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('alerts.condition_above')}
                </button>
                <button
                  onClick={() => setCondition('below')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold min-h-[40px]"
                  style={{
                    backgroundColor: condition === 'below'
                      ? 'color-mix(in srgb, var(--accent-danger) 18%, transparent)'
                      : 'var(--bg-input)',
                    color: condition === 'below' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                  }}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
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
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-[var(--font-mono)]"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
              />
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
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
              />
            </div>

            {formError && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
                  color: 'var(--accent-danger)',
                }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {formError}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={createAlert.isPending || !tokenAddress || !targetPrice}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold min-h-[44px] transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 80%, var(--accent-secondary)))',
                color: '#000',
                boxShadow: '0 4px 12px rgba(240, 180, 41, 0.3)',
              }}
            >
              <Bell className="w-4 h-4" />
              {createAlert.isPending ? t('alerts.creating') : t('alerts.create_button')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl h-20"
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
            />
          ))}
        </div>
      )}

      {!isLoading && displayAlerts.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('alerts.no_alerts')}
          </p>
        </div>
      )}

      <AnimatePresence>
        {displayAlerts.map((alert, idx) => {
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

          const condColor = alert.condition === 'above' ? 'var(--accent-tertiary)' : 'var(--accent-danger)';

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              className="rounded-2xl p-3.5 relative overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              layout
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: statusColor }}
              />

              <div className="pl-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {alert.token_symbol || alert.token_address.slice(0, 10)}
                    </span>
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color: statusColor,
                        background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                      }}
                    >
                      {alert.triggered && <BellRing className="w-2.5 h-2.5" />}
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {alert.triggered && (
                      <button
                        onClick={() => dismissAlert.mutate({ id: alert.id, wallet: address })}
                        className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center"
                        style={{ color: 'var(--accent-warning)' }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleAlert.mutate({ id: alert.id, wallet: address })}
                      className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {alert.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteAlert.mutate({ id: alert.id, wallet: address })}
                      className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1">
                    {alert.condition === 'above' ? (
                      <TrendingUp className="w-3 h-3" style={{ color: condColor }} />
                    ) : (
                      <TrendingDown className="w-3 h-3" style={{ color: condColor }} />
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {alert.condition === 'above' ? t('alerts.when_above') : t('alerts.when_below')}
                    </span>
                    <span className="text-xs font-bold font-[var(--font-mono)]" style={{ color: condColor }}>
                      {formatPrice(alert.target_price)}
                    </span>
                  </div>
                  {alert.current_price != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {t('alerts.current_price')}:
                      </span>
                      <span className="text-xs font-semibold font-[var(--font-mono)]" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(alert.current_price)}
                      </span>
                    </div>
                  )}
                </div>

                {alert.note && (
                  <p className="text-[11px] italic" style={{ color: 'var(--text-secondary)' }}>
                    {alert.note}
                  </p>
                )}

                {alert.triggered && alert.triggered_at && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
                      color: 'var(--accent-warning)',
                    }}
                  >
                    <BellRing className="w-2.5 h-2.5" />
                    {t('alerts.alert_triggered')} {timeAgo(alert.triggered_at)}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
