'use client';

import { motion } from 'framer-motion';
import { Link as LinkIcon, ArrowLeftRight, Droplets } from 'lucide-react';
import { t } from '@/i18n';

const steps = [
  {
    number: '01',
    icon: LinkIcon,
    titleKey: 'landing.how_step1_title',
    descKey: 'landing.how_step1_desc',
  },
  {
    number: '02',
    icon: ArrowLeftRight,
    titleKey: 'landing.how_step2_title',
    descKey: 'landing.how_step2_desc',
  },
  {
    number: '03',
    icon: Droplets,
    titleKey: 'landing.how_step3_title',
    descKey: 'landing.how_step3_desc',
  },
];

export function LandingHowItWorks() {
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
            {t('landing.how_title')}
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('landing.how_subtitle')}
          </p>
        </motion.div>

        <div className="relative">
          <div
            className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] h-px -translate-y-1/2"
            style={{
              background: 'linear-gradient(90deg, rgba(240,180,41,0.1), rgba(240,180,41,0.4), rgba(240,180,41,0.1))',
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: 'rgba(240,180,41,0.06)',
                      border: '1px solid rgba(240,180,41,0.15)',
                      boxShadow: '0 0 30px rgba(240,180,41,0.08)',
                    }}
                  >
                    <span
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{
                        background: 'linear-gradient(135deg, #F0B429, #D97706)',
                        color: '#050810',
                        boxShadow: '0 0 15px rgba(240,180,41,0.3)',
                      }}
                    >
                      {step.number}
                    </span>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#F0B429' }} />
                  </div>

                  <h3
                    className="text-xl sm:text-2xl font-bold mb-3"
                    style={{ fontFamily: 'var(--font-heading)', color: 'white' }}
                  >
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {t(step.descKey)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
