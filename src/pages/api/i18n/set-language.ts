import type { APIRoute } from "astro";
import { translations } from "@/infrastructure/i18n/locales";
import { getLocalizedPath } from "@/infrastructure/i18n/astro";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const lang = url.searchParams.get("lang");
  const redirectTo = url.searchParams.get("redirect") || "/";

  if (lang && translations[lang as any]) {
    // Set cookie for 1 year
    cookies.set("lang", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    try {
      // Use getLocalizedPath to generate the version of the current page in the new target language
      const localizedPath = getLocalizedPath(redirectTo, lang as any);
      
      // Preservation of search and hash
      const isRelative = !redirectTo.startsWith("http");
      const base = isRelative ? "http://localhost" : "";
      const urlToRedirect = new URL(redirectTo, base);
      
      // Construct final URL
      const finalRedirect = localizedPath + urlToRedirect.search + urlToRedirect.hash;
      
      return redirect(finalRedirect);
    } catch (e) {
      // Fallback if URL parsing fails
      return redirect(`/${lang}${redirectTo.startsWith('/') ? redirectTo : '/' + redirectTo}`);
    }
  }

  return redirect(redirectTo);
};
