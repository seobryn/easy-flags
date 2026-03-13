/**
 * Analytics Query Endpoints
 * GET /api/analytics/metrics
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { AnalyticsService } from "@application/services";
import { getUserFromContext } from "@utils/auth";
import { checkSpaceAccessAuth } from "@utils/permissions";

const analyticsService = new AnalyticsService();

/**
 * GET /api/analytics/metrics
 * Query analytics metrics for a space
 *
 * Query params:
 * - space_id or spaceId: number (required)
 * - environment_id or environmentId?: number
 * - feature_id or featureId?: number
 * - date_from or dateFrom?: string (ISO date)
 * - date_to or dateTo?: string (ISO date)
 * - metric_type?: "evaluations" | "usage" | "performance" (default: "usage")
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = getUserFromContext(context);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Support both snake_case and camelCase parameters
    const spaceId =
      context.url.searchParams.get("spaceId") ||
      context.url.searchParams.get("space_id");
    if (!spaceId) {
      return new Response(
        JSON.stringify({ error: "spaceId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if user has access to this space
    const { isAuthorized } = await checkSpaceAccessAuth(
      context,
      Number(spaceId),
    );
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Access denied to space" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const environmentId =
      context.url.searchParams.get("environmentId") ||
      context.url.searchParams.get("environment_id");
    const featureId =
      context.url.searchParams.get("featureId") ||
      context.url.searchParams.get("feature_id");
    const dateFrom =
      context.url.searchParams.get("dateFrom") ||
      context.url.searchParams.get("date_from");
    const dateTo =
      context.url.searchParams.get("dateTo") ||
      context.url.searchParams.get("date_to");
    const metricType = context.url.searchParams.get("metric_type") || "usage";

    const filters = {
      spaceId: Number(spaceId),
      environmentId: environmentId ? Number(environmentId) : undefined,
      featureId: featureId ? Number(featureId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 1000,
    };

    let data;

    switch (metricType) {
      case "evaluations":
        data = await analyticsService.getFlagEvaluations(filters);
        break;
      case "performance":
        data = await analyticsService.getPerformanceMetrics(
          "flag_evaluation",
          1000,
        );
        break;
      case "usage":
      default:
        data = await analyticsService.getUsageMetrics(filters);
        break;
    }

    // Ensure we always return an array or object
    if (!data) {
      data = [];
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error querying analytics metrics:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");

    return new Response(
      JSON.stringify({
        error: "Failed to query metrics",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
