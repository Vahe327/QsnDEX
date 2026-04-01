'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Layers,
  Shield,
  Sparkles,
  Coins,
  Rocket,
  PlusCircle,
} from 'lucide-react';
import { t } from '@/i18n';

const features = [
  {
    icon: ArrowLeftRight,
    titleKey: 'landing.feature_swap_title',
    descKey: 'landing.feature_swap_desc',
  },
  {
    icon: Droplets,
    titleKey: 'landing.feature_pools_title',
    descKey: 'landing.feature_pools_desc',
  },
  {
    icon: BarChart3,
    titleKey: 'landing.feature_analytics_title',
    descKey: 'landing.feature_analytics_desc',
  },
  {
    icon: Layers,
    titleKey: 'landing.feature_batch_title',
    descKey: 'landing.feature_batch_desc',
  },
  {
    icon: Shield,
    titleKey: 'landing.feature_safety_title',
    descKey: 'landing.feature_safety_desc',
  },
  {
    icon: Sparkles,
    titleKey: 'landing.feature_ai_title',
    descKey: 'landing.feature_ai_desc',
  },
  {
    icon: Coins,
    titleKey: 'landing.feature_staking_title',
    descKey: 'landing.feature_staking_desc',
  },
  {
    icon: Rocket,
    titleKey: 'landing.feature_launchpad_title',
    descKey: 'landing.feature_launchpad_desc',
  },
  {
    icon: PlusCircle,
    titleKey: 'landing.feature_create_pools_title',
    descKey: 'landing.feature_create_pools_desc',
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="relative py-20 sm:py-28 px-4"
      style={{ background: '#FFF9ED' }}
    >
      <div className="mx-auto max-w-7xl">
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
            {t('landing.features_title')}
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: '#5A5E6B' }}>
            {t('landing.features_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(240,180,41,0.1), rgba(217,119,6,0.08))',
                    border: '1px solid rgba(240,180,41,0.15)',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: '#B8860B' }} />
                </div>
                <h3
                  className="text-lg sm:text-xl font-bold mb-3"
                  style={{ fontFamily: 'var(--font-heading)', color: '#0A0E18' }}
                >
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5A5E6B' }}>
                  {t(feature.descKey)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
