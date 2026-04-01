'use client';

import { ReactNode, useState, useEffect, createContext, useContext, useCallback } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const STORAGE_KEY = 'qsndex-theme';
const ATTRIBUTE = 'data-theme';
const DEFAULT_THEME = 'dark';

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  resolvedTheme: DEFAULT_THEME,
});

export const useTheme = () => useContext(ThemeContext);

function applyTheme(theme: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(ATTRIBUTE, theme);
}

function getStoredTheme(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

const rainbowDark = darkTheme({
  accentColor: '#F0B429',
  accentColorForeground: '#050810',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

rainbowDark.colors.modalBackground = '#14161E';
rainbowDark.colors.profileForeground = '#14161E';
rainbowDark.colors.connectButtonBackground = '#14161E';
rainbowDark.colors.connectButtonInnerBackground = '#1A1D28';
rainbowDark.colors.connectButtonText = '#F1F3F9';
rainbowDark.fonts.body = 'Inter, sans-serif';

const rainbowLight = lightTheme({
  accentColor: '#B8860B',
  accentColorForeground: '#FFFFFF',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

rainbowLight.fonts.body = 'Inter, sans-serif';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            gcTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  const themeValue: ThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme: theme,
  };

  const currentRainbowTheme = theme === 'light' ? rainbowLight : rainbowDark;

  return (
    <ThemeContext.Provider value={themeValue}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={currentRainbowTheme}
            locale="en"
            modalSize="compact"
            appInfo={{
              appName: 'QsnDEX',
              learnMoreUrl: 'https://taiko.xyz',
            }}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeContext.Provider>
  );
}
