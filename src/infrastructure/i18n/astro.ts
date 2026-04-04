import { createTranslator } from "./translator";
import {
  translations,
  DEFAULT_LANGUAGE,
  type AvailableLanguages,
} from "./locales";

/**
 * Gets the current locale from an Astro request.
 * For now it just returns the default or what's in the cookies.
 * In the future, this can be more sophisticated (detect from URL or Header)
 */
export function getLocale(request: Request): AvailableLanguages {
  // Simple check for a 'lang' cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=");
        return [key, v.join("=")];
      }),
    );
    if (cookies.lang && translations[cookies.lang]) {
      return cookies.lang as AvailableLanguages;
    }
  }

  // Fallback to English for now
  return DEFAULT_LANGUAGE;
}

/**
 * Creates a server-side translator for Astro pages.
 */
export function getTranslator(request: Request) {
  const lang = getLocale(request);
  return {
    t: createTranslator(
      lang as string,
      translations,
      DEFAULT_LANGUAGE as string,
    ),
    lang,
  };
}
