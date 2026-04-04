/**
 * Simple translation utility for Easy Flags.
 * Supports nesting and interpolation like {key}.
 */

export type TranslationMap = { [key: string]: string | TranslationMap };
export type LanguagesMap = { [lang: string]: TranslationMap };

/**
 * Creates a translator function for a given language.
 *
 * @param lang The current language (e.g. 'en')
 * @param translations A map of translations by language
 * @param fallbackLang The fallback language if a key is missing (optional)
 * @returns A translator function (t)
 */
export function createTranslator(
  lang: string,
  translations: LanguagesMap,
  fallbackLang: string = 'en'
) {
  const currentTranslations = translations[lang] || {};
  const fallbackTranslations = translations[fallbackLang] || {};

  /**
   * Helper to get a value from a nested path like 'nested.key'
   */
  const getNestedValue = (obj: TranslationMap, path: string): string | undefined => {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }

    return typeof current === 'string' ? current : undefined;
  };

  /**
   * Translates a key, interpolating variables if provided.
   */
  return (key: string, variables?: Record<string, string | number>): string => {
    let value = getNestedValue(currentTranslations, key);

    // Fallback if not found in current language
    if (value === undefined && lang !== fallbackLang) {
      value = getNestedValue(fallbackTranslations, key);
    }

    // Return key if still not found
    if (value === undefined) {
      return key;
    }

    // Direct string return if no variables
    if (!variables) {
      return value;
    }

    // Simple interpolation for {varName}
    return Object.entries(variables).reduce((acc, [name, val]) => {
      // Use dynamic regex to replace all instances of {name}
      return acc.replace(new RegExp(`\\{${name}\\}`, 'g'), String(val));
    }, value);
  };
}
