'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertTriangle, Check } from 'lucide-react';
import { t } from '@/i18n';
import { TokenIcon } from '@/components/common/TokenIcon';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/useTokens';
import { useTokenStore } from '@/store/tokenStore';
import { useChain } from '@/hooks/useChain';
import { NATIVE_ETH, type TokenInfo } from '@/config/tokens';
import { shortenAddress } from '@/lib/formatters';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  selectedToken?: string;
  otherToken?: string;
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  otherToken,
}: TokenSelectorProps) {
  const [query, setQuery] = useState('');
  const [importCandidate, setImportCandidate] = useState<TokenInfo | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { tokens, isLoading, setSearchQuery, importToken, nativeToken, defaultTokens } = useTokens();
  const { customTokens, addCustomToken } = useTokenStore();
  const { chainId } = useChain();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setImportCandidate(null);
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, setSearchQuery]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setSearchQuery(value);
      setImportCandidate(null);
    },
    [setSearchQuery]
  );

  const isAddress = useMemo(() => /^0x[a-fA-F0-9]{40}$/.test(query), [query]);

  const allTokens = useMemo(() => {
    const combined = new Map<string, TokenInfo>();
    combined.set(nativeToken.address.toLowerCase(), nativeToken);
    for (const tok of defaultTokens) {
      combined.set(tok.address.toLowerCase(), tok);
    }
    for (const tok of customTokens) {
      combined.set(tok.address.toLowerCase(), tok);
    }
    for (const tok of tokens) {
      combined.set(tok.address.toLowerCase(), tok);
    }
    return Array.from(combined.values());
  }, [tokens, customTokens, defaultTokens, nativeToken]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allTokens;
    const q = query.toLowerCase();
    return allTokens.filter(
      (tok) =>
        tok.symbol.toLowerCase().includes(q) ||
        tok.name.toLowerCase().includes(q) ||
        tok.address.toLowerCase().includes(q)
    );
  }, [allTokens, query]);

  const handleImportByAddress = useCallback(async () => {
    if (!isAddress) return;
    setIsImporting(true);
    try {
      const result = await importToken(query);
      if (result?.token) {
        const tokenInfo: TokenInfo = {
          chainId: 167000,
          address: result.token.address,
          name: result.token.name,
          symbol: result.token.symbol,
          decimals: result.token.decimals,
          logoURI: result.token.logoURI || '/tokens/unknown.png',
        };
        setImportCandidate(tokenInfo);
      }
    } catch {
      setImportCandidate(null);
    } finally {
      setIsImporting(false);
    }
  }, [isAddress, query, importToken]);

  useEffect(() => {
    if (isAddress && filtered.length === 0) {
      handleImportByAddress();
    }
  }, [isAddress, filtered.length, handleImportByAddress]);

  const handleConfirmImport = useCallback(() => {
    if (!importCandidate) return;
    addCustomToken(importCandidate);
    onSelect(importCandidate);
    onClose();
  }, [importCandidate, addCustomToken, onSelect, onClose]);

  const handleSelect = useCallback(
    (token: TokenInfo) => {
      if (
        token.address.toLowerCase() === otherToken?.toLowerCase() ||
        token.address.toLowerCase() === selectedToken?.toLowerCase()
      ) {
        return;
      }
      onSelect(token);
      onClose();
    },
    [onSelect, onClose, otherToken, selectedToken]
  );

  const popularTokens = useMemo(
    () => defaultTokens.slice(0, 5),
    [defaultTokens]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'card w-full max-w-md flex flex-col max-h-[90vh] md:max-h-[85vh]',
              'rounded-t-3xl md:rounded-[24px] overflow-hidden'
            )}
          >
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--color-text-muted)]/30" />
            </div>

            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-lg font-bold text-[var(--color-text)]">{t('swap.selectToken')}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(30,41,59,0.5)] transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('swap.searchTokenPlaceholder')}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all duration-300',
                    'bg-[rgba(6,10,19,0.6)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]',
                    'border border-[rgba(56,189,248,0.06)]',
                    'focus:border-[rgba(6,182,212,0.3)] focus:shadow-[0_0_20px_rgba(6,182,212,0.06)]'
                  )}
                />
              </div>
            </div>

            {popularTokens.length > 0 && (
              <div className="px-5 pb-3">
                <div className="flex flex-wrap gap-2">
                  {popularTokens.map((tok) => {
                    const isSelected = tok.address.toLowerCase() === selectedToken?.toLowerCase();
                    const isOther = tok.address.toLowerCase() === otherToken?.toLowerCase();
                    return (
                      <button
                        key={tok.address}
                        onClick={() => handleSelect(tok)}
                        disabled={isSelected || isOther}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                          'border',
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[rgba(6,182,212,0.1)] text-[var(--color-primary)]'
                            : isOther
                              ? 'border-[rgba(56,189,248,0.04)] bg-[rgba(30,41,59,0.3)] text-[var(--color-text-muted)] cursor-not-allowed'
                              : 'border-[rgba(56,189,248,0.06)] text-[var(--color-text-secondary)] hover:border-[rgba(6,182,212,0.2)] hover:text-[var(--color-text)] hover:shadow-[0_0_12px_rgba(6,182,212,0.06)]'
                        )}
                      >
                        <TokenIcon address={tok.address} symbol={tok.symbol} logoURI={tok.logoURI} chainId={chainId} size="xs" />
                        {tok.symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="gradient-divider mx-5" />

            <div className="flex-1 overflow-y-auto min-h-0 py-2">
              {isLoading && filtered.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 && !importCandidate ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                  {isImporting ? (
                    <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-8 h-8 mb-2" />
                      <p className="text-sm">{t('swap.noTokensFound')}</p>
                    </>
                  )}
                </div>
              ) : importCandidate && filtered.length === 0 ? (
                <div className="p-4">
                  <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-warning)] mb-1">
                          {t('swap.tokenNotVerified')}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {t('swap.tokenNotVerifiedDesc')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 p-3 bg-[rgba(15,23,42,0.6)] rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-[rgba(30,41,59,0.8)] flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
                        {importCandidate.symbol.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-text)]">{importCandidate.name}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{importCandidate.symbol}</p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate font-[var(--font-mono)]">
                          {importCandidate.address}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleConfirmImport}
                      className="w-full mt-3 py-2.5 bg-[var(--color-warning)]/15 hover:bg-[var(--color-warning)]/25 text-[var(--color-warning)] font-semibold rounded-xl transition-all duration-200"
                    >
                      {t('swap.importToken')}
                    </button>
                  </div>
                </div>
              ) : (
                filtered.map((tok) => {
                  const isSelected = tok.address.toLowerCase() === selectedToken?.toLowerCase();
                  const isOther = tok.address.toLowerCase() === otherToken?.toLowerCase();
                  const isCustom = customTokens.some(
                    (c) => c.address.toLowerCase() === tok.address.toLowerCase()
                  );
                  return (
                    <button
                      key={tok.address}
                      onClick={() => handleSelect(tok)}
                      disabled={isSelected || isOther}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-3 transition-all duration-200',
                        isSelected
                          ? 'bg-[rgba(6,182,212,0.05)]'
                          : isOther
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-[rgba(6,182,212,0.03)] hover:shadow-[inset_0_0_0_1px_rgba(6,182,212,0.06)]'
                      )}
                    >
                      <TokenIcon address={tok.address} symbol={tok.symbol} logoURI={tok.logoURI} chainId={chainId} size="lg" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-text)]">{tok.symbol}</span>
                          {isCustom && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded-full font-medium">
                              {t('swap.imported')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)] truncate">{tok.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {isSelected ? (
                          <Check className="w-5 h-5 text-[var(--color-primary)]" />
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[80px] block font-[var(--font-mono)]">
                            {shortenAddress(tok.address)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
