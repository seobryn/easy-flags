import React, {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
} from "react";
import { createTranslator, getLocalizedPath as sharedGetLocalizedPath } from "./translator";
import {
  translations,
  DEFAULT_LANGUAGE,
  type AvailableLanguages,
} from "./locales";

interface I18nContextType {
  locale: AvailableLanguages;
  t: (key: string, variables?: Record<string, string | number>) => string;
  getLocalizedPath: (path: string, locale?: AvailableLanguages) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: AvailableLanguages;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LANGUAGE,
}: I18nProviderProps) {
  const t = useMemo(
    () =>
      createTranslator(
        initialLocale as string,
        translations,
        DEFAULT_LANGUAGE as string,
      ),
    [initialLocale],
  );

  const getLocalizedPath = useMemo(
    () => (path: string, locale: AvailableLanguages = initialLocale) => {
      const supportedLocales = Object.keys(translations);
      return sharedGetLocalizedPath(path, locale, supportedLocales);
    },
    [initialLocale],
  );

  return (
    <I18nContext.Provider value={{ locale: initialLocale, t, getLocalizedPath }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/**
 * Shorthand hook for translation only
 */
export function useTranslate(overrideLocale?: AvailableLanguages) {
  const context = useContext(I18nContext);
  
  // Determine locale to use
  const localeToUse = overrideLocale || context?.locale || DEFAULT_LANGUAGE;

  // Use memo to avoid recreative translator on every render if not using context
  const t = useMemo(
    () => {
      // If we have context and no override, return the context's translator
      if (context && !overrideLocale) {
        return context.t;
      }
      // Otherwise create a new one
      return createTranslator(
        localeToUse as string,
        translations,
        DEFAULT_LANGUAGE as string,
      );
    },
    [context, overrideLocale, localeToUse],
  );

  return t;
}

/**
 * Shorthand hook for localized paths
 */
export function useLocalizedPath() {
  const context = useContext(I18nContext);
  
  if (context) {
    return context.getLocalizedPath;
  }

  // Fallback if no context
  return (path: string, locale: AvailableLanguages = DEFAULT_LANGUAGE) => {
    const supportedLocales = Object.keys(translations);
    return sharedGetLocalizedPath(path, locale, supportedLocales);
  };
}
