/**
 * Flag Evaluation Endpoint
 * GET /api/features/[featureKey]/evaluate
 * Evaluates a feature flag and automatically tracks the evaluation
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse, badRequestResponse } from "@/utils/api";
import { getAnalyticsMiddleware, type EvaluationContext } from "@/lib/analytics-middleware";
import { FlagEvaluationService, LimitService } from "@application/services";

const analyticsMiddleware = getAnalyticsMiddleware();
const evaluationService = new FlagEvaluationService();
const limitService = LimitService.getInstance();

/**
 * GET /api/features/[featureKey]/evaluate
 *
 * Evaluate a feature flag for a user and automatically track the evaluation
 *
 * Query parameters:
 * - space_id: number (required) - The space ID
 * - environment_id: number (required) - The environment to evaluate in
 * - api_key: string (required) - API key for authentication
 * - user_id?: string - Optional user ID for context
 * - context?: object - Optional custom context data (JSON stringified)
 *
 * Response:
 * {
 *   "feature_key": string,
 *   "value": boolean | string | object,
 *   "evaluation_time_ms": number,
 *   "environment": string,
 *   "tracked": boolean
 * }
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

    const { params } = context;
    const featureKey = params.featureKey as string;

    if (!featureKey) {
      return new Response(
        JSON.stringify(badRequestResponse("featureKey is required")),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const spaceId = context.url.searchParams.get("space_id");
    const environmentId = context.url.searchParams.get("environment_id");
    const apiKey = context.url.searchParams.get("api_key");
    const userId = context.url.searchParams.get("user_id");
    const contextData = context.url.searchParams.get("context");

    if (!spaceId || !environmentId || !apiKey) {
      return new Response(
        JSON.stringify(
          badRequestResponse(
            "space_id, environment_id, and api_key are required",
          ),
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check monthly API rate limit
    const rateLimit = await limitService.checkApiRateLimit(parseInt(spaceId));
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify(badRequestResponse(rateLimit.error || "API rate limit exceeded")),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Evaluate using our core service
    const result = await evaluationService.evaluateFlag(featureKey, {
      spaceId: parseInt(spaceId),
      environmentId: parseInt(environmentId),
      apiKey,
      userId: userId || undefined,
      customContext: contextData ? JSON.parse(contextData) : {},
    });

    if (result.error && result.error.includes("not found")) {
      return new Response(JSON.stringify({ error: result.error, feature_key: featureKey }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Track the evaluation asynchronously if we got a featureId
    if (result.featureId) {
      const trackContext: EvaluationContext = {
        spaceId: parseInt(spaceId),
        environmentId: parseInt(environmentId),
        featureId: result.featureId,
        apiKey,
        userId: userId || undefined,
        customContext: contextData ? JSON.parse(contextData) : {},
      };

      analyticsMiddleware.trackEvaluation(trackContext, result).catch((err) => {
        console.error("Failed to track evaluation:", err);
      });
    }

    return new Response(
      JSON.stringify({
        feature_key: featureKey,
        value: result.value,
        evaluation_time_ms: result.evaluationTimeMs,
        environment: parseInt(environmentId),
        tracked: !!result.featureId,
        error: result.error,
        rate_limit: {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error evaluating feature flag:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to evaluate feature flag",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

/**
 * POST /api/features/[featureKey]/evaluate
 *
 * Evaluate a feature flag with POST body for complex context
 *
 * Body:
 * {
 *   "space_id": number (required),
 *   "environment_id": number (required),
 *   "api_key": string (required),
 *   "user_id"?: string,
 *   "context"?: object
 * }
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

    const { params } = context;
    const featureKey = params.featureKey as string;
    const body = await context.request.json();

    const { space_id, environment_id, api_key, user_id, context: customContext } =
      body;

    if (!featureKey || !space_id || !environment_id || !api_key) {
      return new Response(
        JSON.stringify(
          badRequestResponse(
            "featureKey, space_id, environment_id, and api_key are required",
          ),
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Evaluate using our core service
    const result = await evaluationService.evaluateFlag(featureKey, {
      spaceId: space_id,
      environmentId: environment_id,
      apiKey: api_key,
      userId: user_id,
      customContext: customContext || {},
    });

    if (result.error && result.error.includes("not found")) {
      return new Response(JSON.stringify({ error: result.error, feature_key: featureKey }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare evaluation context for tracking
    if (result.featureId) {
      const trackContext: EvaluationContext = {
        spaceId: space_id,
        environmentId: environment_id,
        featureId: result.featureId,
        apiKey: api_key,
        userId: user_id,
        customContext: customContext || {},
      };

      // Track the evaluation
      analyticsMiddleware.trackEvaluation(trackContext, result).catch((err) => {
        console.error("Failed to track evaluation:", err);
      });
    }

    return new Response(
      JSON.stringify({
        feature_key: featureKey,
        value: result.value,
        evaluation_time_ms: result.evaluationTimeMs,
        environment: environment_id,
        tracked: !!result.featureId,
        error: result.error,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error evaluating feature flag:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to evaluate feature flag",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
