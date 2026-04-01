'use client';

import { t } from '@/i18n';
import { AIChat } from '@/components/ai/AIChat';

export function MobileAI() {
  return (
    <div className="px-3 pt-2 pb-2 flex flex-col" style={{ height: 'calc(100dvh - 56px - 64px)' }}>
      <AIChat
        className="!h-full !max-h-full"
      />
    </div>
  );
}
