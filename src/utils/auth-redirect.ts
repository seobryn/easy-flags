import type { AstroGlobal } from "astro";
import { getUserFromContext } from "./auth";

/**
 * Check if user is authenticated and redirect to login with return URL if not
 *
 * Usage in Astro pages:
 * ```astro
 * ---
 * import { requireAuth } from "@/utils/auth-redirect";
 * if (!requireAuth(Astro)) {
 *   return Astro.redirect(getLoginUrl(Astro));
 * }
 * ---
 * ```
 */
export function requireAuth(astroContext: AstroGlobal): boolean {
  const user = getUserFromContext(astroContext);

  if (!user) {
    return false;
  }
  return true;
}

/**
 * Get login URL with redirect parameter
 */
export function getLoginUrl(astroContext: AstroGlobal): string {
  const currentUrl = astroContext.url.pathname + astroContext.url.search;
  return `/login?redirect=${encodeURIComponent(currentUrl)}`;
}

/**
 * Check if user is already authenticated and redirect away from auth pages
 *
 * Usage in Astro pages:
 * ```astro
 * ---
 * import { redirectIfAuthenticated } from "@/utils/auth-redirect";
 * if (redirectIfAuthenticated(Astro)) {
 *   return Astro.redirect("/spaces");
 * }
 * ---
 * ```
 */
export function redirectIfAuthenticated(
  astroContext: AstroGlobal,
  redirectTo: string = "/spaces",
): boolean {
  const user = getUserFromContext(astroContext);

  if (user) {
    return true;
  }
  return false;
}
