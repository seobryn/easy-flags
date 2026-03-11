/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows relative URLs (starting with /) or same-origin absolute URLs
 */
export function isValidRedirectUrl(redirectUrl: string | null): boolean {
  if (!redirectUrl) return false;

  // Must be a string
  if (typeof redirectUrl !== "string") return false;

  // Trim whitespace
  const trimmed = redirectUrl.trim();

  // Must not be empty
  if (!trimmed) return false;

  // Block javascript: and data: URLs
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
    return false;
  }

  // Allow relative URLs (start with /)
  if (trimmed.startsWith("/")) {
    return true;
  }

  // Allow same-origin absolute URLs (optional, for flexibility)
  try {
    const url = new URL(
      trimmed,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );

    // Check if it's the same origin (or localhost for development)
    if (typeof window !== "undefined") {
      return url.origin === window.location.origin;
    }

    return false;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitize redirect URL - only allows safe URLs
 * Falls back to defaultUrl if invalid
 */
export function getSafeRedirectUrl(
  redirectUrl: string | null | undefined,
  defaultUrl: string = "/spaces",
): string {
  if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
    return redirectUrl.trim();
  }
  return defaultUrl;
}

/**
 * Protected routes that should require authentication check
 * Before redirecting to these, ensure user is properly authenticated
 */
export const PROTECTED_REDIRECT_PATHS = [
  "/spaces",
  "/dev/db-inspector",
] as const;

/**
 * Public routes where redirect isn't needed for auth
 */
export const PUBLIC_REDIRECT_PATHS = [
  "/login",
  "/create-account",
  "/",
  "/docs",
  "/api-reference",
  "/privacy",
  "/terms",
  "/contact",
  "/billing",
] as const;
