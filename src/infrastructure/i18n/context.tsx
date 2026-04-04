import React, {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
} from "react";
import { createTranslator } from "./translator";
import {
  translations,
  DEFAULT_LANGUAGE,
  type AvailableLanguages,
} from "./locales";

interface I18nContextType {
  locale: AvailableLanguages;
  t: (key: string, variables?: Record<string, string | number>) => string;
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

  return (
    <I18nContext.Provider value={{ locale: initialLocale, t }}>
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
export function useTranslate() {
  return useI18n().t;
}
