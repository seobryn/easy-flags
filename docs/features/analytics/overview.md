# Analytics & Observability Implementation Guide

This document describes the analytics and observability layer added to Easy Flags following **hexagonal architecture** principles.

## Overview

The analytics system tracks:
- **Flag Evaluations**: Every time a flag is evaluated
- **Usage Metrics**: Aggregated metrics per flag per day
- **Performance Metrics**: Response time and latency tracking
- **Flag Impact Analysis**: Trend analysis and adoption rates

## Architecture

Following hexagonal architecture, the analytics system is organized into layers:

### Domain Layer (`src/domain/entities.ts`)
Core business entities for analytics:
- `FlagEvaluation` - Individual flag evaluation record
- `FlagUsageMetric` - Daily aggregated metrics
- `PerformanceMetric` - Latency and performance data
- `FlagImpactAnalysis` - Calculated impact insights
- DTOs for data transfer

### Application Layer (`src/application/services`)
Business logic orchestration:
- `AnalyticsService` - Main service for all analytics operations
  - `trackFlagEvaluation()` - Record single evaluation
  - `getUsageMetrics()` - Query usage data
  - `analyzeFlagImpact()` - Compute flag impact

### Ports Layer (`src/application/ports/repositories.ts`)
Repository interfaces (contracts):
- `FlagEvaluationRepository` - Evaluation data access
- `FlagUsageMetricRepository` - Usage metrics access
- `PerformanceMetricRepository` - Performance data access

### Infrastructure Layer (`src/infrastructure/adapters`)
**Adapter file**: `libsql-analytics.adapter.ts`
- `LibSqlFlagEvaluationRepository`
- `LibSqlFlagUsageMetricRepository`
- `LibSqlPerformanceMetricRepository`

Updated `registry.ts` to provide IoC container for analytics repositories.

## Database Schema

Three new tables in `src/lib/db.ts`:

### `flag_evaluations` Table
```sql
CREATE TABLE flag_evaluations (
  id INTEGER PRIMARY KEY,
  space_id INTEGER,
  environment_id INTEGER,
  feature_id INTEGER,
  api_key_hash TEXT,           -- Hashed for security
  was_enabled BOOLEAN,
  evaluation_result TEXT,
  evaluation_time_ms INTEGER,
  error_message TEXT,
  context_data TEXT,           -- JSON
  created_at DATETIME
);
```

**Purpose**: Raw evaluation records, useful for debugging and detailed analysis.
**Retention**: Can be pruned after 90 days (implement cleanup task)
**Indexes**: space_id, environment_id, feature_id, created_at for fast queries

### `flag_usage_metrics` Table
```sql
CREATE TABLE flag_usage_metrics (
  id INTEGER PRIMARY KEY,
  space_id INTEGER,
  environment_id INTEGER,
  feature_id INTEGER,
  metric_date TEXT,            -- YYYY-MM-DD
  total_evaluations INTEGER,
  enabled_count INTEGER,
  disabled_count INTEGER,
  error_count INTEGER,
  avg_evaluation_time_ms REAL,
  min_evaluation_time_ms INTEGER,
  max_evaluation_time_ms INTEGER,
  created_at DATETIME,
  updated_at DATETIME
);
```

**Purpose**: Pre-aggregated daily metrics for performance and dashboard queries.
**Retention**: Keep indefinitely (historical data)
**Unique Constraint**: (space_id, environment_id, feature_id, metric_date)

### `performance_metrics` Table
```sql
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY,
  space_id INTEGER,
  metric_type TEXT,            -- "api_latency", "flag_evaluation", etc.
  value_ms INTEGER,
  endpoint TEXT,
  environment_id INTEGER,
  created_at DATETIME
);
```

**Purpose**: Performance tracking for infrastructure monitoring.
**Retention**: Prune after 90 days

## API Endpoints

### 1. Track Flag Evaluation
```
POST /api/analytics/track
```

Request body:
```json
{
  "space_id": 1,
  "environment_id": 2,
  "feature_id": 5,
  "api_key": "YOUR_API_KEY",
  "was_enabled": true,
  "evaluation_result": "true",
  "evaluation_time_ms": 2.5,
  "error_message": null,
  "context_data": {
    "user_id": "user_123",
    "country": "US"
  }
}
```

Response (201):
```json
{
  "id": 1,
  "space_id": 1,
  "environment_id": 2,
  "feature_id": 5,
  "api_key_hash": "sha256hash...",
  "was_enabled": true,
  "evaluation_result": "true",
  "evaluation_time_ms": 2.5,
  "created_at": "2026-03-12T10:30:00Z"
}
```

**Security Note**: API keys are hashed (SHA-256) before storage.

### 2. Query Metrics
```
GET /api/analytics/metrics?space_id=1&environment_id=2&metric_type=usage&date_from=2026-03-01&date_to=2026-03-12
```

Query parameters:
- `space_id` (required)
- `environment_id` (optional)
- `feature_id` (optional)
- `date_from` (optional, ISO date)
- `date_to` (optional, ISO date)
- `metric_type` (optional, default: "usage", options: "evaluations", "usage", "performance")

Response (200):
```json
[
  {
    "id": 1,
    "space_id": 1,
    "environment_id": 2,
    "feature_id": 5,
    "metric_date": "2026-03-12",
    "total_evaluations": 15000,
    "enabled_count": 10500,
    "disabled_count": 4500,
    "error_count": 0,
    "avg_evaluation_time_ms": 2.3,
    "min_evaluation_time_ms": 1,
    "max_evaluation_time_ms": 45
  }
]
```

### 3. Flag Impact Analysis
```
GET /api/analytics/impact?space_id=1&feature_id=5&environment_id=2
```

Response (200):
```json
{
  "feature_id": 5,
  "feature_name": "new_checkout_v2",
  "space_id": 1,
  "environment_id": 2,
  "total_evaluations_30d": 450000,
  "enabled_percentage": 70.5,
  "unique_api_keys": 12,
  "avg_response_time_ms": 2.4,
  "error_rate": 0.02,
  "last_evaluated_at": "2026-03-12T10:45:00Z",
  "trend_30d": "increasing"
}
```

## Integration Guide

### 1. Server-Side Tracking (Recommended)

When your clients call your feature flag API, automatically track the evaluation:

```typescript
// In your flag evaluation endpoint
import { AnalyticsService } from "@application/services";
import { hashApiKey, createEvaluationDTO } from "@lib/analytics-tracking";

const analyticsService = new AnalyticsService();

// After evaluating a flag:
const startTime = performance.now();
const flagValue = await evaluateFlag(featureId, environmentId, context);
const evaluationTime = performance.now() - startTime;

// Track the evaluation
await analyticsService.trackFlagEvaluation({
  space_id: spaceId,
  environment_id: environmentId,
  feature_id: featureId,
  api_key_hash: hashApiKey(apiKey),
  was_enabled: flagValue === true,
  evaluation_result: String(flagValue),
  evaluation_time_ms: evaluationTime,
  context_data: context,
});
```

### 2. Client-Side Reporting (Optional)

Clients can also send tracking data directly:

```javascript
// JavaScript SDK usage
const client = new EasyFlagsClient({ apiKey, spaceId });

async function evaluateFlag(featureKey) {
  const start = performance.now();
  const result = await client.isEnabled(featureKey, userId);
  const evaluationTime = performance.now() - start;

  // Optionally report to analytics
  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      space_id: spaceId,
      environment_id: environmentId,
      feature_id: featureId,
      api_key: apiKey,
      was_enabled: result,
      evaluation_result: String(result),
      evaluation_time_ms: evaluationTime,
      context_data: { user_id: userId }
    })
  });

  return result;
}
```

## Dashboard

Visit `/analytics` to view the analytics dashboard. Features:

- **Total Evaluations**: Sum of all flag evaluations in period
- **Enabled %**: Percentage of evaluations that returned true
- **Avg Response Time**: Average flag evaluation latency
- **Error Rate**: Percentage of evaluations that errored
- **Usage by Feature**: Table showing metrics per feature per day
- **Date Range Picker**: Filter metrics by date

## Utilities

Helper functions in `src/lib/analytics-tracking.ts`:

```typescript
// Hash an API key
hashApiKey(apiKey: string): string

// Create evaluation DTO
createEvaluationDTO(options: TrackingOptions): CreateFlagEvaluationDTO

// Record evaluation
recordEvaluationAsync(options: TrackingOptions): Promise<Response>

// Batch tracking
batchTrackEvaluations(evaluations: TrackingOptions[]): Promise<void>

// Format time
formatEvaluationTime(ms: number): string

// Calculate change
calculatePercentageChange(current: number, previous: number): number

// Get trend
getTrendDirection(percentageChange: number): "up" | "down" | "stable"
```

## Best Practices

### 1. API Key Security
- API keys are hashed before storage (SHA-256)
- Never log or store raw API keys
- Raw key seen only at creation time

### 2. Data Retention
```typescript
// Run cleanup periodically (cron job)
const analyticsService = new AnalyticsService();

// Clean evaluations older than 90 days
await analyticsService.cleanupOldEvaluations(90);

// Clean performance metrics older than 90 days
await analyticsService.cleanupOldPerformanceMetrics(90);
```

### 3. Batch Tracking
For high-volume scenarios, batch records:

```typescript
const evaluations = [
  { spaceId: 1, environmentId: 2, ... },
  { spaceId: 1, environmentId: 2, ... },
  // ... more
];

await batchTrackEvaluations(evaluations);
```

### 4. Query Optimization
- Use date filters to limit result set
- Query by environment_id to narrow scope
- Indexes exist on: space_id, environment_id, feature_id, created_at

### 5. Context Data
Include rich context for better insights:

```json
{
  "context_data": {
    "user_id": "user_123",
    "country": "US",
    "plan_tier": "pro",
    "version": "1.0",
    "request_id": "req_abc123"
  }
}
```

## Monitoring & Alerts

Consider implementing alerts for:
- Error rate > 1%
- Average response time > 10ms
- Enabled percentage unexpected changes
- No evaluations in X time (flag disabled by accident)

## Migration from Other Systems

If migrating from another flag service (LaunchDarkly, Split, etc.):

1. **Export historical data** from previous system
2. **Transform to Easy Flags schema**
3. **Bulk insert into flag_usage_metrics** (skip flag_evaluations for speed)
4. **Dashboard will immediately display historical trends**

Example migration script:
```typescript
const migrateMetrics = async (oldMetrics: OldMetricFormat[]) => {
  const analyticsService = new AnalyticsService();
  
  for (const metric of oldMetrics) {
    await analyticsService.recordUsageMetric({
      space_id: getSpaceId(metric),
      environment_id: getEnvironmentId(metric),
      feature_id: getFeatureId(metric),
      metric_date: metric.date,
      total_evaluations: metric.count,
      enabled_count: metric.enabledCount,
      disabled_count: metric.disabledCount,
      error_count: metric.errors || 0,
      avg_evaluation_time_ms: metric.avgLatency || 0,
      min_evaluation_time_ms: metric.minLatency || 0,
      max_evaluation_time_ms: metric.maxLatency || 0,
    });
  }
};
```

## Future Enhancements

Planned additions:
1. **Webhook notifications** on metric anomalies
2. **Real-time metrics** via WebSocket
3. **Custom dashboards** per user
4. **Export to external systems** (datadog, prometheus, etc.)
5. **Advanced filtering** and segmentation
6. **Predictive analytics** for traffic patterns
7. **Cost tracking** (per-evaluation pricing)

---

Visit the [API Reference](/api-reference) for complete endpoint documentation.
