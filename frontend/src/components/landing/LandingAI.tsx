'use client';

import { motion } from 'framer-motion';
import { Shield, TrendingUp, Compass } from 'lucide-react';
import { t } from '@/i18n';

const aiFeatures = [
  {
    icon: Shield,
    titleKey: 'landing.ai_shield_title',
    descKey: 'landing.ai_shield_desc',
  },
  {
    icon: TrendingUp,
    titleKey: 'landing.ai_entry_title',
    descKey: 'landing.ai_entry_desc',
  },
  {
    icon: Compass,
    titleKey: 'landing.ai_autopilot_title',
    descKey: 'landing.ai_autopilot_desc',
  },
];

export function LandingAI() {
  return (
    <section className="relative py-20 sm:py-28 px-4" style={{ background: '#F8F6F0' }}>
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
            style={{ fontFamily: 'var(--font-heading)', color: '#0A0E18' }}
          >
            {t('landing.ai_title')}
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: '#5A5E6B' }}>
            {t('landing.ai_subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-16 sm:gap-20">
          {aiFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            const isReversed = idx % 2 === 1;

            return (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col gap-8 items-center ${
                  isReversed ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(240,180,41,0.12), rgba(217,119,6,0.06))',
                      border: '1px solid rgba(240,180,41,0.15)',
                      boxShadow: '0 4px 32px rgba(240,180,41,0.08)',
                    }}
                  >
                    <Icon className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: '#B8860B' }} />
                  </div>
                </div>

                <div className={`flex-1 ${isReversed ? 'md:text-right' : ''} text-center md:text-left`}>
                  <h3
                    className="text-2xl sm:text-3xl font-bold mb-4"
                    style={{ fontFamily: 'var(--font-heading)', color: '#0A0E18' }}
                  >
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: '#5A5E6B' }}>
                    {t(feature.descKey)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
