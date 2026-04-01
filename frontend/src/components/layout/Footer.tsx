'use client';

import { Github, Twitter, MessageCircle, BookOpen, FileCode2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

export function Footer() {
  return (
    <footer className="relative w-full mt-auto pb-20 md:pb-0">
      <div className="gradient-divider" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Qsn</span>
              <span className="gradient-text">DEX</span>
            </h3>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a
              href="/swagger-ui"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'border transition-all duration-200 text-sm font-medium',
                'hover:text-[var(--accent-primary)] hover:border-[var(--border-glow)]',
              )}
              style={{
                background: 'var(--bg-surface-alpha)',
                borderColor: 'var(--border-glow)',
                color: 'var(--accent-primary)',
                textShadow: '0 0 8px rgba(240,180,41,0.2), 0 1px 1px rgba(0,0,0,0.4)',
              }}
            >
              <FileCode2 className="w-4 h-4" />
              <span>{t('footer.swagger')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'border text-sm font-medium opacity-40 cursor-not-allowed',
              )}
              style={{
                background: 'var(--bg-surface-alpha)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">{t('footer.github')}</span>
            </span>

            <span
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'border text-sm font-medium opacity-40 cursor-not-allowed',
              )}
              style={{
                background: 'var(--bg-surface-alpha)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
            >
              <Twitter className="w-4 h-4" />
              <span className="hidden sm:inline">{t('footer.twitter')}</span>
            </span>

            <span
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'border text-sm font-medium opacity-40 cursor-not-allowed',
              )}
              style={{
                background: 'var(--bg-surface-alpha)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('footer.discord')}</span>
            </span>

            <span
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'border text-sm font-medium opacity-40 cursor-not-allowed',
              )}
              style={{
                background: 'var(--bg-surface-alpha)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t('footer.docs')}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs pt-2" style={{ color: 'var(--text-tertiary)', textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
            <span>{t('footer.powered_by')}</span>
            <a
              href="https://taiko.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors inline-flex items-center gap-0.5 hover:text-[var(--accent-primary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Taiko
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="mx-1">&middot;</span>
            <a
              href="https://arbitrum.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors inline-flex items-center gap-0.5 hover:text-[var(--accent-primary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Arbitrum
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
