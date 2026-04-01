'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, Check, Shield, Sparkles } from 'lucide-react';
import { t } from '@/i18n';

export function LandingHero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: '#050810' }}
    >
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.4), transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.3), transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.25), transparent 60%)' }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto pt-24 sm:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-sm sm:text-base font-medium tracking-widest uppercase mb-6"
          style={{ color: 'rgba(240,180,41,0.8)' }}
        >
          {t('landing.hero_headline')}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight mb-4"
          style={{
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #F0B429 0%, #D97706 40%, #F0B429 70%, #B8860B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 40px rgba(240,180,41,0.15))',
          }}
        >
          QsnDEX
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3"
        >
          <p
            className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide"
            style={{
              color: '#F0B429',
              textShadow: '0 0 20px rgba(240,180,41,0.3), 0 1px 2px rgba(0,0,0,0.5)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <span style={{ color: '#FBBF24' }}>Q</span>uantum{' '}
            <span style={{ color: '#FBBF24' }}>S</span>ecurity{' '}
            <span style={{ color: '#FBBF24' }}>N</span>etwork
          </p>
          <p
            className="text-sm sm:text-base mt-1"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontStyle: 'italic',
            }}
          >
            {t('landing.hero_brand_desc')}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {t('landing.hero_subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href="/app"
            className="inline-flex items-center gap-2 h-12 sm:h-14 px-8 sm:px-10 rounded-2xl text-base sm:text-lg font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #F0B429, #D97706)',
              color: '#050810',
              boxShadow: '0 0 30px rgba(240,180,41,0.3), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <span>{t('landing.hero_launch')}</span>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <a
            href="#features"
            className="inline-flex items-center gap-2 h-12 sm:h-14 px-8 sm:px-10 rounded-2xl text-base sm:text-lg font-bold transition-all duration-300 hover:scale-[1.03]"
            style={{
              border: '1px solid rgba(240,180,41,0.3)',
              color: 'rgba(255,255,255,0.8)',
              background: 'rgba(240,180,41,0.05)',
            }}
          >
            <span>{t('landing.hero_learn')}</span>
            <ChevronDown className="w-4 h-4" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold"
            style={{
              background: 'rgba(240,180,41,0.08)',
              border: '1px solid rgba(240,180,41,0.2)',
              color: 'rgba(240,180,41,0.9)',
            }}
          >
            <Check className="w-3.5 h-3.5" />
            {t('landing.hero_badge_taiko')}
          </span>
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold"
            style={{
              background: 'rgba(240,180,41,0.08)',
              border: '1px solid rgba(240,180,41,0.2)',
              color: 'rgba(240,180,41,0.9)',
            }}
          >
            <Check className="w-3.5 h-3.5" />
            {t('landing.hero_badge_arbitrum')}
          </span>
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold"
            style={{
              background: 'rgba(240,180,41,0.08)',
              border: '1px solid rgba(240,180,41,0.2)',
              color: 'rgba(240,180,41,0.9)',
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            {t('landing.hero_badge_ai')}
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6" style={{ color: 'rgba(240,180,41,0.4)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
