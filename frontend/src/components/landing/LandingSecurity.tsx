'use client';

import { motion } from 'framer-motion';
import { Lock, Shield, Eye, Zap } from 'lucide-react';
import { t } from '@/i18n';

const securityPoints = [
  {
    icon: Lock,
    titleKey: 'landing.security_custody_title',
    descKey: 'landing.security_custody_desc',
  },
  {
    icon: Shield,
    titleKey: 'landing.security_oz_title',
    descKey: 'landing.security_oz_desc',
  },
  {
    icon: Eye,
    titleKey: 'landing.security_source_title',
    descKey: 'landing.security_source_desc',
  },
  {
    icon: Zap,
    titleKey: 'landing.security_l2_title',
    descKey: 'landing.security_l2_desc',
  },
];

export function LandingSecurity() {
  return (
    <section className="relative py-20 sm:py-28 px-4" style={{ background: '#0A0E18' }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #F0B429, #D97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('landing.security_title')}
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('landing.security_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {securityPoints.map((point, idx) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="rounded-2xl p-6 sm:p-8"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: 'rgba(240,180,41,0.08)',
                    border: '1px solid rgba(240,180,41,0.15)',
                    boxShadow: '0 0 20px rgba(240,180,41,0.06)',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: '#F0B429' }} />
                </div>
                <h3
                  className="text-lg sm:text-xl font-bold mb-3"
                  style={{ fontFamily: 'var(--font-heading)', color: 'white' }}
                >
                  {t(point.titleKey)}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t(point.descKey)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
