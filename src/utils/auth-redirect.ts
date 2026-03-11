import type { AstroGlobal } from "astro";
import { getUserFromContext } from "./auth";

/**
 * Check if user is authenticated and redirect to login with return URL if not
 *
 * Usage in Astro pages:
 * ```astro
 * ---
 * import { requireAuth } from "@/utils/auth-redirect";
 * requireAuth(Astro);
 * ---
 * ```
 */
export function requireAuth(astroContext: AstroGlobal): void {
  const user = getUserFromContext(astroContext);

  if (!user) {
    // Redirect to login with current URL as redirect parameter
    const currentUrl = astroContext.url.pathname + astroContext.url.search;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
    astroContext.redirect(loginUrl);
  }
}

/**
 * Check if user is already authenticated and redirect away from auth pages
 *
 * Usage in Astro pages:
 * ```astro
 * ---
 * import { redirectIfAuthenticated } from "@/utils/auth-redirect";
 * redirectIfAuthenticated(Astro);
 * ---
 * ```
 */
export function redirectIfAuthenticated(
  astroContext: AstroGlobal,
  redirectTo: string = "/spaces",
): void {
  const user = getUserFromContext(astroContext);

  if (user) {
    astroContext.redirect(redirectTo);
  }
}
