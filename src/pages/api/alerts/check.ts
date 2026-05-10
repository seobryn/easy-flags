/**
 * Alert Check Endpoint
 * Checks current usage and returns any active alerts
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getUserFromContext } from "@utils/auth";
import { PricingService, LimitService } from "@application/services";
import { unauthorizedResponse } from "@utils/api";

const pricingService = new PricingService();
const limitService = LimitService.getInstance();

/**
 * GET /api/alerts/check
 * Check if any alerts should be triggered based on current usage
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);
    
    if (!user) {
      console.warn('Alerts API: User not authenticated');
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's subscription and plan limits
    const subscription = await pricingService.getUserSubscription(user.id);
    if (!subscription || !subscription.plan) {
      return new Response(
        JSON.stringify({ alerts: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get plan limits
    const limits = await limitService.getPlanLimits(subscription.plan.id);

    // Calculate usage metrics for each metric type
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [apiCalls, featureFlags, environments, teamMembers] = await Promise.all([
      limitService.getApiCallUsage(user.id, undefined, periodStart, periodEnd),
      limitService.getFeatureFlagCount(user.id, undefined),
      limitService.getEnvironmentCount(user.id, undefined),
      limitService.getTeamMemberCount(user.id, undefined),
    ]);

    // Get limits for each metric
    const getLimitValue = (limitName: string): number => {
      const limit = limits.find((l: any) => l.limit_name === limitName);
      return limit?.limit_value || 0;
    };

    const apiCallLimit = getLimitValue("api_requests_per_month");
    const featureFlagLimit = getLimitValue("max_flags");
    const environmentLimit = getLimitValue("max_environments");
    const teamMemberLimit = getLimitValue("max_members");

    // Build usage data with percentages
    const usageData = {
      api_calls: {
        current: apiCalls,
        limit: apiCallLimit,
        percentage: apiCallLimit > 0 ? Math.min((apiCalls / apiCallLimit) * 100, 100) : 0,
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

    // Check each usage metric and create alerts
    const alerts: Array<{
      metric: string;
      current: number;
      limit: number;
      percentage: number;
      severity: 'warning' | 'critical';
    }> = [];
    
    const metricThresholds: Record<string, { warning: number; critical: number }> = {
      api_calls: { warning: 80, critical: 90 },
      feature_flags: { warning: 80, critical: 90 },
      environments: { warning: 80, critical: 90 },
      team_members: { warning: 80, critical: 90 },
    };
    
    Object.entries(usageData).forEach(([metric, data]: [string, any]) => {
      if (data.limit > 0 && data.percentage > 0) {
        const thresholds = metricThresholds[metric] || { warning: 80, critical: 90 };
        
        if (data.percentage >= thresholds.critical) {
          alerts.push({
            metric,
            current: data.current,
            limit: data.limit,
            percentage: data.percentage,
            severity: 'critical',
          });
        } else if (data.percentage >= thresholds.warning) {
          alerts.push({
            metric,
            current: data.current,
            limit: data.limit,
            percentage: data.percentage,
            severity: 'warning',
          });
        }
      }
    });

    console.log('Alerts API: Returning alerts:', alerts.length, 'alerts found');
    
    return new Response(JSON.stringify({ success: true, data: { alerts } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Alerts API: Error:', error);
    return new Response(
      JSON.stringify({
        error: "Failed to check alerts",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};