'use client';

import { useCallback, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxDecimals?: number;
  max?: string;
  label?: string;
  suffix?: React.ReactNode;
  onMax?: () => void;
}

const NUMBER_REGEX = /^[0-9]*[.]?[0-9]*$/;

export function NumberInput({
  value,
  onChange,
  placeholder = '0.0',
  disabled = false,
  className,
  maxDecimals = 18,
  label,
  suffix,
  onMax,
}: NumberInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '.');

      if (raw === '' || raw === '.') {
        onChange(raw);
        return;
      }

      if (!NUMBER_REGEX.test(raw)) return;

      const dotIndex = raw.indexOf('.');
      if (dotIndex !== -1) {
        const decimals = raw.length - dotIndex - 1;
        if (decimals > maxDecimals) return;
      }

      onChange(raw);
    },
    [onChange, maxDecimals],
  );

  return (
    <div className="flex flex-col gap-1.5">
      {(label || onMax) && (
        <div className="flex items-center justify-between px-1">
          {label && (
            <span className="text-xs text-[var(--text-secondary)]">{label}</span>
          )}
          {onMax && (
            <button
              onClick={onMax}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-3',
          'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
          'focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_0_3px_rgba(240,180,41,0.08),0_0_12px_rgba(240,180,41,0.15)]',
          'transition-all duration-200',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent outline-none',
            'text-xl font-semibold text-[var(--text-primary)]',
            'placeholder:text-[var(--text-tertiary)]',
            disabled && 'cursor-not-allowed',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        {suffix}
      </div>
    </div>
  );
}
