'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Pencil, Trash2, Search, Check } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import type { TokenInfo } from '@/config/tokens';

export interface BatchOrderState {
  tokenOut: string;
  tokenOutSymbol: string;
  percentage: number;
}

interface BatchTokenRowProps {
  index: number;
  order: BatchOrderState;
  tokens: TokenInfo[];
  onUpdate: (index: number, field: keyof BatchOrderState, value: string | number) => void;
  onRemove: (index: number) => void;
  quoteAmount?: string;
}

export function BatchTokenRow({
  index,
  order,
  tokens,
  onUpdate,
  onRemove,
  quoteAmount,
}: BatchTokenRowProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rawPercent, setRawPercent] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayPercent = (order.percentage / 100).toFixed(2);

  const filteredTokens = tokens.filter((token) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      token.symbol.toLowerCase().includes(q) ||
      token.name.toLowerCase().includes(q) ||
      token.address.toLowerCase().includes(q)
    );
  });

  const selectedToken = tokens.find(
    (tk) => tk.address.toLowerCase() === order.tokenOut.toLowerCase()
  );

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsSelectOpen(false);
      setSearchQuery('');
    }
  }, []);

  useEffect(() => {
    if (isSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
      };
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectOpen, handleClickOutside]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setRawPercent(displayPercent);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, displayPercent]);

  const handleTokenSelect = (token: TokenInfo) => {
    onUpdate(index, 'tokenOut', token.address);
    onUpdate(index, 'tokenOutSymbol', token.symbol);
    setIsSelectOpen(false);
    setSearchQuery('');
  };

  const handlePercentChange = (rawValue: string) => {
    const cleaned = rawValue.replace(/[^0-9.]/g, '');
    setRawPercent(cleaned);
  };

  const handlePercentBlur = () => {
    const parsed = parseFloat(rawPercent);
    if (!Number.isNaN(parsed)) {
      const bps = Math.round(Math.min(10000, Math.max(0, parsed * 100)));
      onUpdate(index, 'percentage', bps);
    }
    setIsEditing(false);
  };

  const handlePercentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePercentBlur();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative flex items-center gap-3 rounded-2xl p-3',
        'transition-all duration-200',
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, var(--bg-input) 15%, var(--bg-input) 85%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(0,0,0,0.2)',
        borderTopColor: 'rgba(0,0,0,0.25)',
        borderBottomColor: 'rgba(255,255,255,0.03)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(255,255,255,0.03), 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums"
        style={{
          background: 'linear-gradient(180deg, rgba(240,180,41,0.12) 0%, rgba(240,180,41,0.04) 100%)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(240,180,41,0.2)',
          textShadow: '0 0 8px rgba(240,180,41,0.3), 0 1px 1px rgba(0,0,0,0.5)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {index + 1}
      </span>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsSelectOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
            'transition-all duration-200',
            'hover:brightness-110 cursor-pointer min-w-[130px]'
          )}
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, var(--bg-surface) 15%, var(--bg-surface) 85%, rgba(0,0,0,0.08) 100%)',
            border: '1px solid rgba(240,180,41,0.08)',
            borderTopColor: 'rgba(255,255,255,0.06)',
            borderBottomColor: 'rgba(0,0,0,0.12)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
            color: order.tokenOut ? 'var(--text-primary)' : 'var(--text-secondary)',
            textShadow: order.tokenOut
              ? '0 1px 2px rgba(0,0,0,0.5)'
              : '0 1px 1px rgba(0,0,0,0.35)',
          }}
        >
          {selectedToken ? (
            <>
              <TokenIcon address={selectedToken.address} symbol={selectedToken.symbol} logoURI={selectedToken.logoURI} size="xs" />
              <span>{selectedToken.symbol}</span>
            </>
          ) : (
            <span>{t('batch.selectToken')}</span>
          )}
          <ChevronDown
            size={14}
            className={cn(
              'ml-auto transition-transform duration-200',
              isSelectOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isSelectOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border p-2',
                'shadow-xl backdrop-blur-xl'
              )}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="flex items-center gap-2 rounded-lg border px-2 py-1.5 mb-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <Search size={14} style={{ color: 'var(--text-secondary)', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('swap.searchTokenPlaceholder')}
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)' }}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                {filteredTokens.length === 0 ? (
                  <div
                    className="px-3 py-4 text-center text-sm"
                    style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                  >
                    {t('swap.noTokensFound')}
                  </div>
                ) : (
                  filteredTokens.map((token) => {
                    const isSelected =
                      token.address.toLowerCase() === order.tokenOut.toLowerCase();
                    return (
                      <button
                        key={token.address}
                        type="button"
                        onClick={() => handleTokenSelect(token)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm',
                          'transition-colors duration-150 cursor-pointer',
                          isSelected && 'ring-1'
                        )}
                        style={{
                          color: 'var(--text-primary)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)',
                          backgroundColor: isSelected ? 'var(--bg-surface-2)' : undefined,
                          outline: isSelected ? '1px solid var(--accent-primary)' : undefined,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <TokenIcon address={token.address} symbol={token.symbol} logoURI={token.logoURI} size="sm" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{token.symbol}</span>
                          <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                          >
                            {token.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check
                            size={14}
                            className="ml-auto"
                            style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 4px rgba(240,180,41,0.3))' }}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
        >
          {t('batch.percentage')}
        </span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={rawPercent}
            onChange={(e) => handlePercentChange(e.target.value)}
            onBlur={handlePercentBlur}
            onKeyDown={handlePercentKeyDown}
            className={cn(
              'w-16 rounded-md border px-1.5 py-0.5 text-center text-sm font-semibold',
              'outline-none focus:ring-1'
            )}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)',
              outlineColor: 'var(--accent-primary)',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-sm font-semibold transition-all hover:brightness-110"
            style={{
              color: 'var(--accent-primary)',
              textShadow: '0 0 8px rgba(240,180,41,0.3), 0 1px 1px rgba(0,0,0,0.5)',
              background: 'linear-gradient(180deg, rgba(240,180,41,0.12) 0%, rgba(240,180,41,0.04) 100%)',
              border: '1px solid rgba(240,180,41,0.15)',
              borderTopColor: 'rgba(240,180,41,0.2)',
              borderBottomColor: 'rgba(0,0,0,0.1)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {displayPercent}%
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-end gap-0.5 min-w-0">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
        >
          {t('batch.estOutput')}
        </span>
        <span
          className="truncate text-sm font-medium max-w-full text-right"
          style={{
            color: quoteAmount ? 'var(--text-primary)' : 'var(--text-secondary)',
            textShadow: quoteAmount
              ? '0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.15)'
              : '0 1px 1px rgba(0,0,0,0.35)',
          }}
        >
          {quoteAmount || '—'}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            'transition-colors duration-150 cursor-pointer',
            'hover:brightness-110'
          )}
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
          title={t('batch.edit')}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            'transition-colors duration-150 cursor-pointer',
            'hover:brightness-110'
          )}
          style={{
            color: 'var(--accent-danger)',
            backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
          }}
          title={t('batch.remove')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
