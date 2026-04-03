# Analytics Middleware Documentation

The **Analytics Middleware** (`src/lib/analytics-middleware.ts`) provides automatic tracking of flag evaluations without requiring manual integration at every evaluation point.

## Overview

Instead of manually calling tracking functions, the middleware wraps flag evaluation logic and automatically records:
- Flag evaluation attempt
- Evaluation result (enabled/disabled)
- Evaluation time
- Errors that occurred
- User and custom context

## Core Components

### AnalyticsMiddleware Class

The main class that provides tracking capabilities.

```typescript
import { getAnalyticsMiddleware } from "@/lib/analytics-middleware";

const middleware = getAnalyticsMiddleware();
```

### Key Methods

#### `trackEvaluation(context, result)`

Track a single flag evaluation.

```typescript
import { getAnalyticsMiddleware, type EvaluationContext, type EvaluationResult } from "@/lib/analytics-middleware";

const middleware = getAnalyticsMiddleware();

// Prepare context
const context: EvaluationContext = {
  spaceId: 1,
  environmentId: 2,
  featureId: 5,
  apiKey: "your_api_key",
  userId: "user_123",
  customContext: { country: "US", tier: "pro" }
};

// Prepare result
const result: EvaluationResult = {
  value: true,
  evaluationTimeMs: 2.5,
  error: undefined // Only set if evaluation failed
};

// Track
await middleware.trackEvaluation(context, result);
```

#### `trackEvaluationBatch(contexts, results)`

Track multiple evaluations at once.

```typescript
const contexts: EvaluationContext[] = [ /* ... */ ];
const results: EvaluationResult[] = [ /* ... */ ];

await middleware.trackEvaluationBatch(contexts, results);
```

#### `createTrackedEvaluator(evaluationFn)`

Wrap an evaluation function to automatically track after each call.

```typescript
// Your original evaluation function
async function evaluateFlag(context: EvaluationContext): Promise<boolean> {
  // ... evaluation logic
  return true;
}

// Wrap it with tracking
const trackedEval = middleware.createTrackedEvaluator(evaluateFlag);

// Use it - tracking happens automatically
const { value, tracked } = await trackedEval(context);
```

## Integration with Evaluation Endpoint

The middleware is automatically integrated into the `/api/features/[featureKey]/evaluate` endpoint. Whenever this endpoint is called, evaluations are automatically tracked.

### Example Usage

**GET Request:**
```
GET /api/features/new_checkout_v2/evaluate?space_id=1&environment_id=2&api_key=sk_xxx&user_id=user_123
```

**POST Request:**
```
POST /api/features/new_checkout_v2/evaluate
{
  "space_id": 1,
  "environment_id": 2,
  "api_key": "sk_xxx",
  "user_id": "user_123",
  "context": {
    "country": "US",
    "plan": "pro"
  }
}
```

**Response:**
```json
{
  "feature_key": "new_checkout_v2",
  "value": true,
  "evaluation_time_ms": 2.3,
  "environment": 2,
  "tracked": true
}
```

## Automatic Tracking Features

### Non-blocking Tracking

Tracking is performed asynchronously and **does not block** the flag evaluation response. If tracking fails for any reason:
- The evaluation result is still returned to the client
- An error is logged to console
- The client receives a successful response

This ensures that analytics failures never impact flag availability.

### Error Handling

If a flag evaluation fails, the error is captured and stored:

```json
{
  "feature_key": "feature_key",
  "value": false,
  "evaluation_time_ms": 1.5,
  "error": "Failed to parse flag value",
  "tracked": true
}
```

### Context Enrichment

The middleware enriches evaluation records with:
- **User ID**: Provided by the client for user-specific analysis
- **Custom Context**: Any additional data sent by the client (country, tier, version, etc.)
- **Evaluation Time**: Automatic measurement of evaluation latency
- **API Key Hash**: Secure hashing of the API key for multi-client tracking

## Data Flow

```
Client Request
    ↓
Evaluate Flag
    ↓
Middleware.trackEvaluation() (Async)
    ├→ Create DTO with evaluation data
    ├→ Hash API key
    ├→ Call AnalyticsService.trackFlagEvaluation()
    └→ Store in database (non-blocking)
    ↓
Return Response to Client
```

## Best Practices

### 1. Always Provide API Key

API keys are hashed and used to track which clients are using which flags. This enables you to:
- Identify multiple clients
- Track client-specific evaluation patterns
- Debug client-specific issues

### 2. Include User Context

Providing `user_id` enables:
- User-specific analytics
- Deterministic rollout calculations
- Better trend analysis

```typescript
const context: EvaluationContext = {
  // ...
  userId: currentUser.id, // Important for analytics
};
```

### 3. Use Custom Context for Rich Insights

Pass additional context for better analytics:

```typescript
const context: EvaluationContext = {
  // ...
  customContext: {
    country: userCountry,
    plan_tier: userPlan,
    app_version: clientVersion,
    request_path: currentPath,
  }
};
```

### 4. Monitor Evaluation Performance

The `evaluation_time_ms` is automatically tracked. Monitor it over time to detect:
- Slow evaluation logic
- Database query performance issues
- Network latency

## Advanced Usage

### Custom Evaluated Function Wrapping

For complex evaluation logic, wrap your function:

```typescript
async function evaluateFlagWithComplexLogic(context: EvaluationContext): Promise<boolean> {
  const demographic = await fetchUserDemographics(context.userId);
  const country = demographic.country;
  
  // Complex business logic
  if (country === "US" && demographic.plan === "pro") {
    return true;
  }
  
  return false;
}

const tracked = middleware.createTrackedEvaluator(evaluateFlagWithComplexLogic);
const { value } = await tracked(context);
```

### Batch Operations

For bulk imports or migrations:

```typescript
const evaluatedFlags = [
  // ... many evaluations
];

const contexts = evaluatedFlags.map(e => ({...}));
const results = evaluatedFlags.map(e => ({...}));

await middleware.trackEvaluationBatch(contexts, results);
```

## Monitoring & Debugging

### View Tracked Evaluations

Query tracked evaluations via the analytics API:

```
GET /api/analytics/metrics?space_id=1&date_from=2026-03-12&date_to=2026-03-13
```

### Check Tracking Status

The response includes `"tracked": true/false` indicating if tracking succeeded.

### Error Logs

Check server logs for tracking errors:

```
Failed to track flag evaluation: [error message]
```

## Performance Considerations

- **Asynchronous**: Tracking happens in the background, not on the request path
- **Non-blocking**: Failures don't affect flag evaluation
- **Batch-friendly**: Use `trackEvaluationBatch()` for high-volume operations
- **Hashed Keys**: API keys are hashed before storage (no raw keys stored)

## Migration Guide

If moving from manual tracking to middleware:

**Before:**
```typescript
// Manual tracking
const result = await evaluateFlag(...);
await analyticsService.trackFlagEvaluation(dto);
return result;
```

**After:**
```typescript
// Automatic tracking
const { value } = await trackedEvaluator(context);
return value;
```

---

For more information on analytics, see [ANALYTICS_GUIDE.md](../ANALYTICS_GUIDE.md).
