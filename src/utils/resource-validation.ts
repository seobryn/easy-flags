import type { AstroGlobal } from "astro";

/**
 * Check if a resource exists and redirect to 404 if not
 *
 * Usage:
 * ```astro
 * ---
 * import { checkResourceExists } from "@/utils/resource-validation";
 *
 * const { spaceId } = Astro.params;
 * const space = await spaceService.getSpace(parseInt(spaceId));
 *
 * checkResourceExists(space, Astro);
 * ---
 * ```
 */
export function checkResourceExists(
  resource: any,
  astroContext: AstroGlobal,
  resourceName: string = "Resource",
): void {
  if (!resource) {
    console.warn(`${resourceName} not found, redirecting to 404`);
    astroContext.redirect("/404");
  }
}

/**
 * Validate resource ownership/access for nested resources
 * Ensures parent resource exists and matches expected ID
 *
 * Usage:
 * ```astro
 * ---
 * const { spaceId, featureId } = Astro.params;
 * const feature = await featureService.getFeature(parseInt(featureId));
 *
 * validateNestedResource(
 *   feature,
 *   "space_id",
 *   parseInt(spaceId),
 *   Astro,
 *   "Feature with this space"
 * );
 * ---
 * ```
 */
export function validateNestedResource(
  resource: any,
  parentFieldName: string,
  expectedParentId: number,
  astroContext: AstroGlobal,
  resourceName: string = "Resource",
): void {
  if (!resource) {
    console.warn(`${resourceName} not found, redirecting to 404`);
    astroContext.redirect("/404");
  }

  if (resource[parentFieldName] !== expectedParentId) {
    console.warn(`${resourceName} parent ID mismatch, redirecting to 404`);
    astroContext.redirect("/404");
  }
}

/**
 * Type to represent a validation result
 */
export interface ValidationResult {
  isValid: boolean;
  redirectTo?: string;
  error?: string;
}

/**
 * Validate multiple resources in a chain
 * Useful for deeply nested routes like /spaces/123/environments/456
 *
 * Returns ValidationResult with redirect URL if validation fails
 */
export function validateResourceChain(
  resources: Array<{
    resource: any;
    parentField?: string;
    expectedParentId?: number;
    name: string;
  }>,
): ValidationResult {
  for (const item of resources) {
    // Check if resource exists
    if (!item.resource) {
      return {
        isValid: false,
        redirectTo: "/404",
        error: `${item.name} not found`,
      };
    }

    // Check parent relationship if specified
    if (item.parentField && typeof item.expectedParentId === "number") {
      if (item.resource[item.parentField] !== item.expectedParentId) {
        return {
          isValid: false,
          redirectTo: "/404",
          error: `${item.name} does not belong to parent resource`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Handle validation result and redirect if needed
 */
export function handleValidationResult(
  result: ValidationResult,
  astroContext: AstroGlobal,
): void {
  if (!result.isValid && result.redirectTo) {
    console.warn(
      `Validation failed: ${result.error}, redirecting to ${result.redirectTo}`,
    );
    astroContext.redirect(result.redirectTo);
  }
}
