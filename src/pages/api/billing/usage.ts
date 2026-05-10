/**
 * Billing Usage API Endpoint
 * GET /api/billing/usage
 * 
 * Returns current usage metrics vs plan limits for the authenticated user
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getUserFromContext } from "@utils/auth";
import { PricingService, LimitService } from "@application/services";
import { badRequestResponse, unauthorizedResponse } from "@utils/api";

const pricingService = new PricingService();
const limitService = LimitService.getInstance();

/**
 * GET /api/billing/usage
 * 
 * Query params:
 * - space_id?: number - Filter by specific space
 * - date_from?: string - Start date for usage calculation (ISO format)
 * - date_to?: string - End date for usage calculation (ISO format)
 * 
 * Response:
 * {
 *   "plan": {
 *     "id": number,
 *     "name": string,
 *     "slug": string,
 *     "is_active": boolean
 *   },
 *   "subscription": {
 *     "status": string,
 *     "current_period_start": string,
 *     "current_period_end": string
 *   },
 *   "usage": {
 *     "api_calls": {
 *       "current": number,
 *       "limit": number,
 *       "percentage": number,
 *       "period": "monthly" | "custom"
 *     },
 *     "feature_flags": {
 *       "current": number,
 *       "limit": number,
 *       "percentage": number
 *     },
 *     "environments": {
 *       "current": number,
 *       "limit": number,
 *       "percentage": number
 *     },
 *     "team_members": {
 *       "current": number,
 *       "limit": number,
 *       "percentage": number
 *     }
 *   },
 *   "period": {
 *     "start_date": string,
 *     "end_date": string,
 *     "type": "current_month" | "custom"
 *   }
 * }
 */
export const GET: APIRoute = async (context) => {
  try {
    // Authentication check
    const user = getUserFromContext(context);
    if (!user) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get query parameters
    const spaceId = context.url.searchParams.get("space_id");
    const dateFrom = context.url.searchParams.get("date_from");
    const dateTo = context.url.searchParams.get("date_to");

    // Get user's current subscription and plan
    const subscription = await pricingService.getUserSubscription(user.id);
    if (!subscription || !subscription.plan) {
      return new Response(
        JSON.stringify(badRequestResponse("No active subscription found")),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Determine time period for usage calculation
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    let periodType: "current_month" | "custom" = "current_month";

    if (dateFrom && dateTo) {
      // Custom date range
      periodStart = new Date(dateFrom);
      periodEnd = new Date(dateTo);
      periodType = "custom";
    } else {
      // Default to current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Calculate usage metrics
    const usageMetrics = await calculateUsageMetrics(
      user.id,
      spaceId ? Number(spaceId) : undefined,
      periodStart,
      periodEnd,
      subscription.plan
    );

    return new Response(
      JSON.stringify({
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          is_active: subscription.plan.is_active,
        },
        subscription: {
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
        },
        usage: usageMetrics,
        period: {
          start_date: periodStart.toISOString(),
          end_date: periodEnd.toISOString(),
          type: periodType,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching billing usage:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch billing usage",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Calculate usage metrics for the given user and time period
 */
async function calculateUsageMetrics(
  userId: number,
  spaceId: number | undefined,
  periodStart: Date,
  periodEnd: Date,
  plan: any
) {
  // Get plan limits
  const limits = await limitService.getPlanLimits(plan.id);

  // Calculate current usage for each metric
  const [apiCalls, featureFlags, environments, teamMembers] = await Promise.all([
    // API calls usage
    limitService.getApiCallUsage(userId, spaceId, periodStart, periodEnd),
    // Feature flags usage
    limitService.getFeatureFlagCount(userId, spaceId),
    // Environments usage
    limitService.getEnvironmentCount(userId, spaceId),
    // Team members usage
    limitService.getTeamMemberCount(userId, spaceId),
  ]);

  // Get plan limits for each metric
  const apiCallLimit = getLimitValue(limits, "api_requests_per_month") || 0;
  const featureFlagLimit = getLimitValue(limits, "max_flags") || 0;
  const environmentLimit = getLimitValue(limits, "max_environments") || 0;
  const teamMemberLimit = getLimitValue(limits, "max_members") || 0;

  return {
    api_calls: {
      current: apiCalls,
      limit: apiCallLimit,
      percentage: apiCallLimit > 0 ? Math.min((apiCalls / apiCallLimit) * 100, 100) : 0,
      period: "monthly",
    },
    feature_flags: {
      current: featureFlags,
      limit: featureFlagLimit,
      percentage: featureFlagLimit > 0 ? Math.min((featureFlags / featureFlagLimit) * 100, 100) : 0,
    },
    environments: {
      current: environments,
      limit: environmentLimit,
      percentage: environmentLimit > 0 ? Math.min((environments / environmentLimit) * 100, 100) : 0,
    },
    team_members: {
      current: teamMembers,
      limit: teamMemberLimit,
      percentage: teamMemberLimit > 0 ? Math.min((teamMembers / teamMemberLimit) * 100, 100) : 0,
    },
  };
}

/**
 * Helper function to get limit value by name
 */
function getLimitValue(limits: any[], limitName: string): number | undefined {
  const limit = limits.find((l) => l.limit_name === limitName);
  return limit ? limit.limit_value : undefined;
}