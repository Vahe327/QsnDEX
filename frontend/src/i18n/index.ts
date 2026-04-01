import en from './en.json';
import ru from './ru.json';

const translations: Record<string, typeof en> = { en, ru };

let currentLocale = 'en';

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('qsndex-locale');
    if (stored && (stored === 'en' || stored === 'ru')) {
      currentLocale = stored;
    }
  } catch {}
}

export function setLocale(locale: string) {
  if (translations[locale]) {
    currentLocale = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('qsndex-locale', locale);
    }
  }
}

export function getLocale(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('qsndex-locale');
    if (stored && translations[stored]) {
      currentLocale = stored;
    }
  }
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      value = translations.en;
      for (const fk of keys) {
        if (value && typeof value === 'object' && fk in value) {
          value = value[fk];
        } else {
          return key;
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, String(v)),
      value
    );
  }

  return value;
}

export { en, ru };
