import { defineMiddleware } from "astro:middleware";
import { getLocale } from "./infrastructure/i18n/astro";

export const onRequest = defineMiddleware((context, next) => {
  const { url, request, redirect, cookies } = context;

  // Skip middleware for API, internal Astro routes, and static assets
  const isApi = url.pathname.startsWith("/api/");
  const isInternal = url.pathname.startsWith("/_");
  const isStatic = url.pathname.includes(".");

  if (isApi || isInternal || isStatic) {
    return next();
  }

  const pathParts = url.pathname.split("/");
  const firstPart = pathParts[1];
  const supportedLocales = ["en", "es", "fr"];
  const isSupportedLocale = supportedLocales.includes(firstPart);

  // If already has a supported locale prefix, we are good
  if (isSupportedLocale) {
    // Optional: Sync cookie with URL prefix
    cookies.set("lang", firstPart, { path: "/", maxAge: 60 * 60 * 24 * 30 });
    return next();
  }

  // No localized prefix found, decide where to redirect
  const localeFromCookie = cookies.get("lang")?.value;
  const finalLocale =
    localeFromCookie && supportedLocales.includes(localeFromCookie)
      ? localeFromCookie
      : "en";

  // Redirect to the prefixed version
  // e.g., /billing -> /en/billing
  const newPathname = `/${finalLocale}${url.pathname === "/" ? "" : url.pathname}`;
  return redirect(newPathname + url.search + url.hash);
});
