import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Outfit, Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QsnDEX — AI-Powered DEX on Taiko L2',
  description:
    'AI-Powered Multichain DEX on Taiko and Arbitrum. Swap tokens, provide liquidity, and get AI analytics.',
  keywords: ['DEX', 'Taiko', 'DeFi', 'AI', 'Swap', 'Liquidity', 'zkEVM', 'L2', 'QsnDEX'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'QsnDEX — AI-Powered DEX on Taiko L2',
    description: 'AI-Powered Decentralized Exchange on Taiko L2',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050810',
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('qsndex-theme')||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased bg-deep text-primary">
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
