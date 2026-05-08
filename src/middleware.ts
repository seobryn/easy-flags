import { defineMiddleware } from "astro:middleware";
import { getLocale } from "./infrastructure/i18n/astro";
import { SUPPORTED_LOCALES } from "./infrastructure/i18n/locales";
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders, getRateLimitConfig } from "./lib/rate-limit";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect, cookies } = context;

  const isApi = url.pathname.startsWith("/api/");
  const isInternal = url.pathname.startsWith("/_");
  const isStatic = url.pathname.includes(".");

  // Apply rate limiting to API routes
  if (isApi) {
    const clientId = getClientIdentifier(request, "api");
    const config = getRateLimitConfig("api");
    const rateLimit = checkRateLimit(clientId, config);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
          },
        },
      );
    }

    context.request.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    context.request.headers.set("X-RateLimit-Reset", Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString());
  }

  if (isApi || isInternal || isStatic) {
    return next();
  }

  const pathParts = url.pathname.split("/");
  const firstPart = pathParts[1];
  const isSupportedLocale = (SUPPORTED_LOCALES as string[]).includes(firstPart);

  if (isSupportedLocale) {
    cookies.set("lang", firstPart, { path: "/", maxAge: 60 * 60 * 24 * 30 });
    return next();
  }

  const finalLocale = getLocale(request);

  const newPathname = `/${finalLocale}${url.pathname === "/" ? "/" : url.pathname}`;
  const response = redirect(newPathname + url.search + url.hash);
  
  response.headers.set("Vary", "Accept-Language, Cookie");
  
  return response;
});

export const onError = defineMiddleware(async (context, error) => {
  try {
    const { captureError } = await import("./lib/sentry");
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Server error:", msg);
    captureError(error, {
      url: context.url.pathname,
      method: context.request.method,
    });
  } catch {
    // Sentry not available, just log
  }

  return new Response(
    JSON.stringify({ success: false, message: "Internal server error" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
});
