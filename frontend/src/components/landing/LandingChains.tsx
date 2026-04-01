'use client';

import { motion } from 'framer-motion';
import { Hexagon, Box } from 'lucide-react';
import { t } from '@/i18n';

const chains = [
  {
    nameKey: 'landing.chains_taiko_name',
    descKey: 'landing.chains_taiko_desc',
    icon: Hexagon,
    color: '#E81899',
    glow: 'rgba(232,24,153,0.15)',
  },
  {
    nameKey: 'landing.chains_arbitrum_name',
    descKey: 'landing.chains_arbitrum_desc',
    icon: Box,
    color: '#28A0F0',
    glow: 'rgba(40,160,240,0.15)',
  },
];

export function LandingChains() {
  return (
    <section className="relative py-20 sm:py-28 px-4" style={{ background: '#0A0E18' }}>
      <div className="mx-auto max-w-5xl">
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
            {t('landing.chains_title')}
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('landing.chains_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chains.map((chain, idx) => {
            const Icon = chain.icon;
            return (
              <motion.div
                key={chain.nameKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="rounded-2xl p-6 sm:p-8"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: `0 0 40px ${chain.glow}`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: `${chain.color}15`,
                    border: `1px solid ${chain.color}30`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: chain.color }} />
                </div>
                <h3
                  className="text-xl sm:text-2xl font-bold mb-3"
                  style={{ fontFamily: 'var(--font-heading)', color: 'white' }}
                >
                  {t(chain.nameKey)}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t(chain.descKey)}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-8 text-sm font-medium"
          style={{ color: 'rgba(240,180,41,0.5)' }}
        >
          {t('landing.chains_more')}
        </motion.p>
      </div>
    </section>
  );
}
