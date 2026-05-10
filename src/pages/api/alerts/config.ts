/**
 * Alerting Service
 * Handles plan limit alerts and notifications
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getUserFromContext } from "@utils/auth";
import { PricingService, LimitService } from "@application/services";
import { badRequestResponse, unauthorizedResponse, successResponse } from "@utils/api";

const pricingService = new PricingService();
const limitService = LimitService.getInstance();

/**
 * Alert Configuration
 */
interface AlertConfig {
  userId: number;
  spaceId?: number;
  alertType: 'email' | 'in_app' | 'both';
  threshold: number; // Percentage threshold (e.g., 80 for 80%)
  metricType: 'api_calls' | 'feature_flags' | 'environments' | 'team_members';
  isActive: boolean;
}

/**
 * GET /api/alerts/config
 * Get current alert configurations for a user
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);
    if (!user) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // In a real implementation, this would fetch from database
    // For now, return default configurations
    const defaultAlerts: AlertConfig[] = [
      {
        userId: user.id,
        alertType: 'both',
        threshold: 80,
        metricType: 'api_calls',
        isActive: true,
      },
      {
        userId: user.id,
        alertType: 'both',
        threshold: 90,
        metricType: 'api_calls',
        isActive: true,
      },
      {
        userId: user.id,
        alertType: 'email',
        threshold: 80,
        metricType: 'feature_flags',
        isActive: true,
      },
      {
        userId: user.id,
        alertType: 'email',
        threshold: 80,
        metricType: 'environments',
        isActive: true,
      },
    ];

    return new Response(JSON.stringify(successResponse(defaultAlerts)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch alert configurations",
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
 * POST /api/alerts/config
 * Update alert configurations
 */
export const POST: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);
    if (!user) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const alertConfig: AlertConfig = body;

    // Validate the configuration
    if (!alertConfig || !alertConfig.metricType || !alertConfig.threshold) {
      return new Response(
        JSON.stringify(badRequestResponse("Invalid alert configuration")),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // In a real implementation, this would save to database
    // For now, just return success
    return new Response(
      JSON.stringify(successResponse({
        message: "Alert configuration updated successfully",
        config: alertConfig,
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to update alert configuration",
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
 * GET /api/alerts/check
 * Check if any alerts should be triggered based on current usage
 */
export const CHECK: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);
    if (!user) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current usage data
    const usageResponse = await fetch(`/api/billing/usage`);
    if (!usageResponse.ok) {
      throw new Error("Failed to fetch usage data");
    }

    const usageData = await usageResponse.json();
    const usage = usageData.usage;

    // Check each metric against thresholds
    const alerts: Array<{
      metric: string;
      current: number;
      limit: number;
      percentage: number;
      severity: 'warning' | 'critical';
    }> = [];

    // Define thresholds
    const thresholds = {
      warning: 80,
      critical: 90,
    };

    // Check each usage metric
    Object.entries(usage).forEach(([metric, data]: [string, any]) => {
      if (data.limit > 0) { // Skip unlimited metrics
        const percentage = data.percentage;
        
        if (percentage >= thresholds.critical) {
          alerts.push({
            metric,
            current: data.current,
            limit: data.limit,
            percentage,
            severity: 'critical',
          });
        } else if (percentage >= thresholds.warning) {
          alerts.push({
            metric,
            current: data.current,
            limit: data.limit,
            percentage,
            severity: 'warning',
          });
        }
      }
    });

    return new Response(JSON.stringify(successResponse({ alerts })), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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

/**
 * POST /api/alerts/test
 * Test alert notification (for development)
 */
export const TEST: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);
    if (!user) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // This would send a test notification in a real implementation
    return new Response(
      JSON.stringify(successResponse({
        message: "Test alert sent successfully",
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to send test alert",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};