# Audit Logging & Compliance System

## Overview

The audit logging system provides comprehensive security auditing and compliance reporting for Easy Flags. It automatically tracks all sensitive operations, permission denials, and user actions, enabling organizations to:

- Maintain detailed audit trails for compliance (SOC 2, GDPR, HIPAA, etc.)
- Detect and respond to security threats
- Investigate suspicious activity
- Generate compliance reports on-demand
- Monitor who accessed/modified what resources and when

## Architecture

The audit system follows the **Hexagonal Architecture** pattern:

```
Domain Layer
  ├─ AuditLog Entity
  ├─ PermissionDenialLog Entity
  ├─ ComplianceReport Entity
  └─ AuditAction & AuditSeverity Types

Application Layer
  └─ AuditService
      ├─ Audit log operations
      ├─ Permission denial tracking
      └─ Compliance reporting

Ports Layer
  ├─ AuditLogRepository Port
  ├─ PermissionDenialLogRepository Port
  └─ ComplianceReportRepository Port

Infrastructure Layer
  └─ LibSQL Adapters
      ├─ LibSqlAuditLogRepository
      ├─ LibSqlPermissionDenialLogRepository
      └─ LibSqlComplianceReportRepository

Middleware Layer
  └─ AuditMiddleware
      ├─ Automatic event tracking
      ├─ Permission denial logging
      └─ Suspicious activity detection

Presentation Layer
  └─ RESTful API Endpoints
      ├─ GET /api/audit/logs
      ├─ GET /api/audit/denials
      ├─ GET /api/audit/reports
      └─ POST /api/audit/reports
```

## Data Model

### Audit Log Structure

```typescript
interface AuditLog {
  id: number;
  space_id?: number;           // Optional: associated space
  user_id: number;             // Who performed the action
  action: AuditAction;         // Type of action
  resource_type: string;       // What was affected (Space, Feature, etc.)
  resource_id: number;         // ID of the affected resource
  severity: AuditSeverity;     // info | warning | critical
  status: 'success' | 'failure'; // Did it succeed?
  error_message?: string;      // If failed, why?
  changes_before?: string;     // JSON: previous state
  changes_after?: string;      // JSON: new state
  metadata?: string;           // JSON: context (IP, user agent, etc.)
  ip_address?: string;         // Source IP
  user_agent?: string;         // Source browser/client
  created_at: string;          // When it happened
}
```

### Supported Audit Actions

| Category | Actions |
|----------|---------|
| **Space Management** | `SPACE_CREATED`, `SPACE_UPDATED`, `SPACE_DELETED` |
| **Environment Management** | `ENVIRONMENT_CREATED`, `ENVIRONMENT_UPDATED`, `ENVIRONMENT_DELETED` |
| **Feature Management** | `FEATURE_CREATED`, `FEATURE_UPDATED`, `FEATURE_DELETED` |
| **Flag Toggling** | `FLAG_ENABLED`, `FLAG_DISABLED` |
| **Team Management** | `MEMBER_INVITED`, `MEMBER_REMOVED` |
| **Permission Management** | `PERMISSION_GRANTED`, `PERMISSION_REVOKED` |
| **API Management** | `API_KEY_CREATED`, `API_KEY_ROTATED`, `API_KEY_REVOKED` |
| **Authentication** | `FAILED_LOGIN`, `SUCCESSFUL_LOGIN`, `PERMISSION_DENIED` |
| **Configuration** | `SETTINGS_CHANGED`, `ADVANCED_CONFIG_UPDATED` |

### Permission Denial Log Structure

```typescript
interface PermissionDenialLog {
  id: number;
  user_id: number;
  space_id?: number;
  resource_type: string;
  resource_id: number;
  required_permission: string;
  user_role?: string;
  ip_address?: string;
  created_at: string;
}
```

### Compliance Report Structure

```typescript
interface ComplianceReport {
  id: number;
  space_id: number;
  report_type: 'access_log' | 'permission_audit' | 'data_access' | 'compliance_snapshot';
  period_start: string;
  period_end: string;
  total_actions: number;
  critical_actions: number;
  failed_actions: number;
  unique_users: number;
  data: string;  // JSON: detailed report
  created_at: string;
}
```

## Using the Audit System

### 1. Logging Audit Events

#### Using AuditService Directly

```typescript
import { AuditService } from "@/application/services";

const auditService = new AuditService();

// Log a successful action
await auditService.logAudit({
  space_id: 123,
  user_id: 456,
  action: "FEATURE_CREATED",
  resource_type: "Feature",
  resource_id: 789,
  severity: "info",
  status: "success",
  changes_after: {
    name: "new-feature",
    enabled: false,
  },
  metadata: {
    source: "api",
    ipAddress: "192.168.1.1",
  },
});

// Log a failure
await auditService.logAudit({
  action: "PERMISSION_DENIED",
  resource_type: "Feature",
  resource_id: 789,
  severity: "warning",
  status: "failure",
  error_message: "User does not have permission to modify this feature",
});
```

#### Using AuditMiddleware (Recommended)

```typescript
import { getAuditMiddleware } from "@/lib/audit-middleware";

const auditMiddleware = getAuditMiddleware();

await auditMiddleware.track(
  "FEATURE_CREATED",
  {
    userId: 456,
    spaceId: 123,
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
  },
  {
    resourceType: "Feature",
    resourceId: 789,
    severity: "info",
    changesAfter: {
      name: "new-feature",
      enabled: false,
    },
  },
);
```

#### Automatic Tracking with Wrapped Functions

```typescript
const trackedCreateFeature = auditMiddleware.createTrackedAction(
  "FEATURE_CREATED",
  async (spaceId, featureData) => {
    // Your create feature logic
    return createFeature(spaceId, featureData);
  },
  (args) => ({
    userId: currentUser.id,
    spaceId: args[0],
    ipAddress: context.ip,
  }),
  (args, result) => ({
    resourceType: "Feature",
    resourceId: result.id,
    changesAfter: args[1],
  }),
);

// Now creation is automatically audited
const feature = await trackedCreateFeature(123, { name: "my-feature" });
```

### 2. Querying Audit Logs

```typescript
const auditService = new AuditService();

// Get all audit logs for a space
const spaceLogs = await auditService.getSpaceAuditLogs(123, 100);

// Get critical audit logs
const criticalLogs = await auditService.getCriticalAuditLogs(50);

// Get user's activity
const userActivity = await auditService.getUserAuditLogs(456, 100);

// Complex filtering
const filteredLogs = await auditService.getAuditLogs({
  spaceId: 123,
  action: "FEATURE_CREATED",
  severity: "critical",
  status: "failure",
  dateFrom: "2025-01-01",
  dateTo: "2025-01-31",
  limit: 50,
  offset: 0,
});
```

### 3. Permission Denial Tracking

```typescript
// Log a permission denial
await auditService.logPermissionDenial(
  userId, // 456
  "Feature", // resourceType
  789, // resourceId
  "can_modify_feature", // required permission
  {
    spaceId: 123,
    userRole: "viewer",
    ipAddress: "192.168.1.1",
  },
);

// Track via middleware (recommended)
await auditMiddleware.trackPermissionDenial(
  456, // userId
  "Feature",
  789,
  "can_modify_feature",
  { spaceId: 123, ipAddress: "192.168.1.1" },
);

// Get recent denial logs
const recentDenials = await auditService.getUserRecentDenials(456, 24);

// Detect suspicious activity
const isSuspicious = await auditService.detectSuspiciousActivity(
  456,
  5, // threshold: 5 denials
  1, // within 1 hour
);
```

### 4. Compliance Reporting

```typescript
// Generate compliance report
const report = await auditService.generateComplianceReport(
  spaceId, // 123
  "2025-01-01", // dateFrom
  "2025-01-31", // dateTo
  "compliance_snapshot", // reportType
);

console.log(report.data); // Contains:
// {
//   period: { from: "2025-01-01", to: "2025-01-31" },
//   summary: {
//     total: 1250,
//     critical: 15,
//     failed: 42,
//     uniqueUsers: 28
//   },
//   actionBreakdown: { ... },
//   userActivity: { ... }
// }

// Get latest compliance report
const latest = await auditService.getLatestComplianceReport(
  123,
  "compliance_snapshot",
);

// Query compliance reports
const reports = await auditService.getComplianceReports({
  spaceId: 123,
  reportType: "access_log",
  dateFrom: "2025-01-01",
  dateTo: "2025-01-31",
  limit: 10,
});
```

### 5. Data Cleanup

```typescript
// Remove audit logs older than 90 days
const deletedLogs = await auditService.cleanupOldLogs(90);

// Remove permission denial logs older than 90 days
const deletedDenials = await auditService.cleanupOldDenials(90);
```

## REST API Endpoints

### GET /api/audit/logs

Retrieve audit logs with filtering. Requires admin access to the space.

**Query Parameters:**
- `spaceId` (optional): Filter by space
- `userId` (optional): Filter by user
- `action` (optional): Filter by action type
- `severity` (optional): Filter by severity (info, warning, critical)
- `status` (optional): Filter by status (success, failure)
- `dateFrom` (optional): Start date (ISO format)
- `dateTo` (optional): End date (ISO format)
- `limit` (optional, default: 100): Number of results
- `offset` (optional, default: 0): Pagination offset

**Example:**
```bash
curl -X GET "http://localhost:3000/api/audit/logs?spaceId=123&severity=critical&limit=50" \
  -H "Cookie: session=..."
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "space_id": 123,
      "user_id": 456,
      "action": "FEATURE_CREATED",
      "resource_type": "Feature",
      "resource_id": 789,
      "severity": "info",
      "status": "success",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/audit/denials

Retrieve permission denial logs. Users see their own denials; admins can filter by space.

**Query Parameters:**
- `spaceId` (optional): Filter by space (admin only)
- `hoursAgo` (optional, default: 24): Look back period
- `limit` (optional, default: 50): Number of results

**Example:**
```bash
curl -X GET "http://localhost:3000/api/audit/denials?hoursAgo=24&limit=50" \
  -H "Cookie: session=..."
```

### GET /api/audit/reports

Retrieve compliance reports for a space. Requires admin access.

**Query Parameters:**
- `spaceId` (required): Space to filter by

**Example:**
```bash
curl -X GET "http://localhost:3000/api/audit/reports?spaceId=123" \
  -H "Cookie: session=..."
```

**Response:**
```json
{
  "reports": [
    {
      "id": 1,
      "space_id": 123,
      "report_type": "compliance_snapshot",
      "period_start": "2025-01-01",
      "period_end": "2025-01-31",
      "total_actions": 1250,
      "critical_actions": 15,
      "failed_actions": 42,
      "unique_users": 28,
      "created_at": "2025-02-01T00:00:00Z"
    }
  ]
}
```

### POST /api/audit/reports

Generate a new compliance report. Requires admin access.

**Request Body:**
```json
{
  "spaceId": 123,
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31",
  "reportType": "compliance_snapshot"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/audit/reports" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "spaceId": 123,
    "dateFrom": "2025-01-01",
    "dateTo": "2025-01-31",
    "reportType": "compliance_snapshot"
  }'
```

## Security Considerations

1. **Audit Log Immutability**: Audit logs are append-only. Once created, they cannot be modified or deleted (except via automatic cleanup).

2. **Permission Checks**: All audit endpoints require appropriate permissions:
   - View audit logs: Must be space admin
   - Generate reports: Must be space admin
   - View permission denials: Can view own, admins can view all

3. **Sensitive Data**: Avoid logging sensitive data (passwords, tokens, API keys). Use the `changesBeforeAfter` fields for structural changes only.

4. **Performance**: Audit logging is non-blocking. Failed audit logs don't affect application functionality.

5. **Data Retention**: Configure automatic cleanup via `cleanupOldLogs()` and `cleanupOldDenials()` methods based on compliance requirements.

## Compliance Use Cases

### 1. Access Trail Audits
```typescript
// Generate report of all access/modifications in date range
const report = await auditService.generateComplianceReport(
  spaceId,
  "2025-01-01",
  "2025-01-31",
  "access_log",
);
```

### 2. Permission Change Audits
```typescript
// Filter for permission-related changes
const permissionChanges = await auditService.getAuditLogs({
  spaceId,
  action: "PERMISSION_GRANTED", // or PERMISSION_REVOKED
  dateFrom: "2025-01-01",
  dateTo: "2025-01-31",
});
```

### 3. Failure/Error Investigation
```typescript
// Find all failed operations
const failedOps = await auditService.getAuditLogs({
  spaceId,
  status: "failure",
  dateFrom: "2025-01-15",
  dateTo: "2025-01-16",
});
```

### 4. Suspicious Activity Detection
```typescript
// Find users with repeated permission denials
const denials = await auditService.getUserRecentDenials(userId, 24);
if (denials.length > 5) {
  // Alert administrator
}
```

## Best Practices

1. **Log Early and Often**: Track all significant business operations
2. **Include Context**: Use metadata to store IP, user agent, request IDs
3. **Classify Severity**: Use appropriate severity levels for filtering and alerting
4. **Regular Reports**: Schedule compliance reports weekly or monthly
5. **Monitor Denials**: Set alerts for repeated permission denials
6. **Archive Reports**: Export compliance reports for long-term storage
7. **Test Cleanup**: Verify data retention policies don't violate compliance requirements

## Testing

```typescript
import { AuditService } from "@/application/services";

describe("Audit Logging", () => {
  it("should log audit events", async () => {
    const auditService = new AuditService();
    
    const log = await auditService.logAudit({
      user_id: 1,
      action: "FEATURE_CREATED",
      resource_type: "Feature",
      resource_id: 1,
      severity: "info",
      status: "success",
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe("FEATURE_CREATED");
  });

  it("should detect suspicious activity", async () => {
    const auditService = new AuditService();
    
    // Log multiple denials
    for (let i = 0; i < 6; i++) {
      await auditService.logPermissionDenial(1, "Feature", 1, "can_modify");
    }

    const isSuspicious = await auditService.detectSuspiciousActivity(1, 5, 1);
    expect(isSuspicious).toBe(true);
  });
});
```

## Performance Optimization

- Indexes on `space_id`, `user_id`, `created_at` for fast queries
- Audit logs are stored in separate tables to avoid query impact
- Non-blocking async logging to prevent application delays
- Automatic cleanup to manage database size
- Consider read-replica for reporting queries

## Related Documentation

- [Analytics Guide](./ANALYTICS_GUIDE.md) - Feature flag analytics
- [Analytics Middleware](./ANALYTICS_MIDDLEWARE.md) - Automatic analytics tracking
- [Security Audit](./SECURITY_AUDIT.md) - Security recommendations
