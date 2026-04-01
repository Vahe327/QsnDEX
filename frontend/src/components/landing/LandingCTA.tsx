'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { t } from '@/i18n';

export function LandingCTA() {
  return (
    <section className="relative py-24 sm:py-32 px-4 overflow-hidden" style={{ background: '#050810' }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(240,180,41,0.2), transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold mb-4"
          style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-heading)' }}
        >
          {t('landing.cta_title')}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl font-black mb-8 tracking-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #F0B429 0%, #D97706 40%, #F0B429 70%, #B8860B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(240,180,41,0.2))',
          }}
        >
          QsnDEX
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg mb-10 max-w-xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {t('landing.cta_subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/app"
            className="inline-flex items-center gap-2 h-14 sm:h-16 px-10 sm:px-14 rounded-2xl text-lg sm:text-xl font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #F0B429, #D97706)',
              color: '#050810',
              boxShadow: '0 0 40px rgba(240,180,41,0.35), 0 0 80px rgba(240,180,41,0.15), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <span>{t('landing.cta_launch')}</span>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
