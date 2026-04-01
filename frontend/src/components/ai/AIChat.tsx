'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BarChart3,
  TrendingUp,
  Globe,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useAIChat } from '@/hooks/useAI';

interface AIChatProps {
  className?: string;
}

const QUICK_ACTIONS = [
  { labelKey: 'ai.quick_analyze_pool', icon: BarChart3, promptKey: 'ai.quick_prompt_analyze_pool' },
  { labelKey: 'ai.quick_best_pools', icon: TrendingUp, promptKey: 'ai.quick_prompt_best_pools' },
  { labelKey: 'ai.quick_market_overview', icon: Globe, promptKey: 'ai.quick_prompt_market_overview' },
];

export function AIChat({ className }: AIChatProps) {
  const { messages, sendMessage, clearChat, isLoading, error, requestsRemaining } = useAIChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'card',
        'flex flex-col',
        'h-[600px]',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              borderBottom: '1px solid rgba(0,0,0,0.2)',
            }}
          >
            <Bot className="w-4 h-4" style={{ color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('ai.chat_title')}</h3>
            {requestsRemaining !== null && (
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {t('ai.requests_remaining', { count: requestsRemaining })}
              </p>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {t('ai.clear')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.12) 100%)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(0,0,0,0.2)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <Bot className="w-7 h-7" style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 6px rgba(240,180,41,0.4)) drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }} />
            </div>
            <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
              {t('ai.welcome_message')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.labelKey}
                  onClick={() => handleQuickAction(t(action.promptKey))}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl',
                    'bg-[var(--bg-input)] border border-[var(--border-glow)]',
                    'text-xs font-medium text-[var(--text-secondary)]',
                    'hover:text-[var(--accent-primary)] hover:border-[var(--border-active)]',
                    'hover:shadow-[0_0_12px_rgba(240,180,41,0.08)]',
                    'transition-all duration-200',
                  )}
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {t(action.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 flex items-start">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(99,102,241,0.5))',
                      boxShadow: '0 0 8px rgba(99,102,241,0.15)',
                    }}
                  >
                    <Bot className="w-3.5 h-3.5 text-[var(--bg-deep)]" />
                  </div>
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 text-[var(--text-primary)] rounded-br-md border border-[var(--border-glow)]'
                    : 'bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-md',
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 flex items-start">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface-2)] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(99,102,241,0.5))',
                boxShadow: '0 0 8px rgba(99,102,241,0.15)',
              }}
            >
              <Bot className="w-3.5 h-3.5 text-[var(--bg-deep)]" />
            </div>
            <div className="bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-center text-xs text-[var(--accent-danger)] py-2">
            {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && (
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.labelKey}
              onClick={() => handleQuickAction(t(action.promptKey))}
              disabled={isLoading}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg',
                'bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[10px] font-medium text-[var(--text-tertiary)]',
                'hover:text-[var(--accent-primary)] hover:border-[var(--border-glow)] transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <action.icon className="w-3 h-3" />
              {t(action.labelKey)}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pb-4 pt-2 border-t border-[var(--border-subtle)]">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2',
            'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
            'focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_0_3px_rgba(240,180,41,0.06)]',
            'transition-all duration-200',
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.input_placeholder')}
            disabled={isLoading}
            className={cn(
              'flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'outline-none disabled:opacity-50',
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
              'active:scale-95',
            )}
            style={{
              background: 'linear-gradient(135deg, #F0B429, #D97706)',
              boxShadow: input.trim() && !isLoading ? '0 0 12px rgba(240,180,41,0.2)' : 'none',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[var(--bg-deep)] animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-[var(--bg-deep)]" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
