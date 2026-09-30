import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { catalogs } from './catalog';
import { readLocale, writeLocale } from './locale';
import { LocaleContext, type LocaleContextValue } from './useI18n';
import type { Locale } from './types';

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
