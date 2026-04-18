import { 
  createTranslator, 
  getLocalizedPath as sharedGetLocalizedPath 
} from "./translator";
import {
  translations,
  DEFAULT_LANGUAGE,
  type AvailableLanguages,
} from "./locales";

/**
 * Gets the current locale from an Astro request.
 */
export function getLocale(request: Request): AvailableLanguages {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Check URL path prefix (e.g., /es/...)
  const pathParts = pathname.split("/");
  const firstPart = pathParts[1]; // pathParts[0] is empty because path starts with /
  if (firstPart && translations[firstPart as AvailableLanguages]) {
    return firstPart as AvailableLanguages;
  }

  // 2. Fallback to URL query params
  try {
    const langParam = url.searchParams.get("lang");
    if (langParam && translations[langParam as AvailableLanguages]) {
      return langParam as AvailableLanguages;
    }
  } catch (e) {}

  // 3. Check for a 'lang' cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...v] = c.trim().split("=");
        return [key, v.join("=")];
      }),
    );
    if (cookies.lang && translations[cookies.lang as AvailableLanguages]) {
      return cookies.lang as AvailableLanguages;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Returns a path prefixed with the given locale.
 * It removes any existing locale prefix if present.
 */
export function getLocalizedPath(path: string, locale: AvailableLanguages): string {
  const supportedLocales = Object.keys(translations);
  return sharedGetLocalizedPath(path, locale as string, supportedLocales);
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
    getLocalizedPath: (path: string, targetLang: string = lang) => 
      getLocalizedPath(path, targetLang as AvailableLanguages),
  };
}

