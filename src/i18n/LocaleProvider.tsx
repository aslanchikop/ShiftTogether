import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { catalogs } from './catalog';
import { readLocale, writeLocale } from './locale';
import type { Locale, Messages } from './types';

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function browserStore(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readLocale(browserStore()));

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      messages: catalogs[locale],
      setLocale: (next) => {
        setLocaleState(next);
        const store = browserStore();
        if (store) writeLocale(store, next);
      },
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('LocaleProvider is missing');
  return value;
}
