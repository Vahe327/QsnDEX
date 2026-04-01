'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, Wallet } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { getPriceImpactLevel } from '@/lib/formatters';

type ButtonState =
  | 'connect'
  | 'select_token'
  | 'enter_amount'
  | 'insufficient_balance'
  | 'insufficient_liquidity'
  | 'approve'
  | 'approving'
  | 'swap'
  | 'swapping'
  | 'high_impact'
  | 'loading';

interface SwapButtonProps {
  isConnected: boolean;
  onConnect: () => void;
  tokenIn: string | null;
  tokenOut: string | null;
  tokenInSymbol: string;
  amountIn: string;
  balanceRaw: bigint;
  amountInWei: bigint;
  needsApproval: boolean;
  isApproving: boolean;
  onApprove: () => void;
  onSwap: () => void;
  isSwapping: boolean;
  isQuoteLoading: boolean;
  priceImpact: number;
  hasLiquidity: boolean;
}

export function SwapButton({
  isConnected,
  onConnect,
  tokenIn,
  tokenOut,
  tokenInSymbol,
  amountIn,
  balanceRaw,
  amountInWei,
  needsApproval,
  isApproving,
  onApprove,
  onSwap,
  isSwapping,
  isQuoteLoading,
  priceImpact,
  hasLiquidity,
}: SwapButtonProps) {
  const state: ButtonState = useMemo(() => {
    if (!isConnected) return 'connect';
    if (!tokenIn || !tokenOut) return 'select_token';
    if (!amountIn || parseFloat(amountIn) <= 0) return 'enter_amount';
    if (isQuoteLoading) return 'loading';
    if (!hasLiquidity) return 'insufficient_liquidity';
    if (amountInWei > balanceRaw) return 'insufficient_balance';
    if (isApproving) return 'approving';
    if (needsApproval) return 'approve';
    if (isSwapping) return 'swapping';
    const impactLevel = getPriceImpactLevel(priceImpact);
    if (impactLevel === 'blocked') return 'high_impact';
    return 'swap';
  }, [
    isConnected, tokenIn, tokenOut, amountIn, balanceRaw,
    amountInWei, needsApproval, isApproving, isSwapping,
    isQuoteLoading, priceImpact, hasLiquidity,
  ]);

  const impactLevel = getPriceImpactLevel(priceImpact);
  const isHighImpact = impactLevel === 'high' || impactLevel === 'very_high';

  const config = useMemo(() => {
    switch (state) {
      case 'connect':
        return {
          text: t('swap.connectWallet'),
          icon: <Wallet className="w-5 h-5" />,
          disabled: false,
          onClick: onConnect,
          variant: 'primary' as const,
        };
      case 'select_token':
        return {
          text: t('swap.selectToken'),
          icon: null,
          disabled: true,
          onClick: () => {},
          variant: 'disabled' as const,
        };
      case 'enter_amount':
        return {
          text: t('swap.enterAmount'),
          icon: null,
          disabled: true,
          onClick: () => {},
          variant: 'disabled' as const,
        };
      case 'loading':
        return {
          text: t('swap.fetchingQuote'),
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          disabled: true,
          onClick: () => {},
          variant: 'disabled' as const,
        };
      case 'insufficient_balance':
        return {
          text: t('swap.insufficientBalance', { token: tokenInSymbol }),
          icon: <AlertTriangle className="w-5 h-5" />,
          disabled: true,
          onClick: () => {},
          variant: 'danger' as const,
        };
      case 'insufficient_liquidity':
        return {
          text: t('swap.insufficientLiquidity'),
          icon: <AlertTriangle className="w-5 h-5" />,
          disabled: true,
          onClick: () => {},
          variant: 'danger' as const,
        };
      case 'approve':
        return {
          text: t('swap.approve', { token: tokenInSymbol }),
          icon: null,
          disabled: false,
          onClick: onApprove,
          variant: 'primary' as const,
        };
      case 'approving':
        return {
          text: t('swap.approving'),
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          disabled: true,
          onClick: () => {},
          variant: 'disabled' as const,
        };
      case 'swapping':
        return {
          text: t('swap.swapping'),
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          disabled: true,
          onClick: () => {},
          variant: 'disabled' as const,
        };
      case 'high_impact':
        return {
          text: t('swap.priceImpactTooHigh'),
          icon: <AlertTriangle className="w-5 h-5" />,
          disabled: true,
          onClick: () => {},
          variant: 'danger' as const,
        };
      case 'swap':
      default:
        return {
          text: isHighImpact ? t('swap.swapAnyway') : t('swap.swap'),
          icon: isHighImpact ? <AlertTriangle className="w-5 h-5" /> : null,
          disabled: false,
          onClick: onSwap,
          variant: isHighImpact ? ('danger-active' as const) : ('primary' as const),
        };
    }
  }, [state, tokenInSymbol, onConnect, onApprove, onSwap, isHighImpact]);

  const variantClasses = {
    primary: '',
    disabled: 'opacity-50 !cursor-not-allowed !shadow-none !transform-none [&]:bg-gradient-to-r [&]:from-[#334155] [&]:to-[#475569]',
    danger: 'opacity-60 !cursor-not-allowed !shadow-none !transform-none [&]:bg-gradient-to-r [&]:from-red-600/80 [&]:to-red-500/80',
    'danger-active': '[&]:bg-gradient-to-r [&]:from-red-600 [&]:to-red-500 [&]:shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:[&]:shadow-[0_8px_32px_rgba(239,68,68,0.4)]',
  };

  return (
    <motion.button
      whileHover={!config.disabled ? { scale: 1.01, y: -2 } : {}}
      whileTap={!config.disabled ? { scale: 0.99, y: 1 } : {}}
      onClick={config.onClick}
      disabled={config.disabled}
      className={cn(
        'btn-primary w-full h-14 rounded-2xl font-bold text-base',
        variantClasses[config.variant]
      )}
    >
      {config.icon}
      {config.text}
    </motion.button>
  );
}
