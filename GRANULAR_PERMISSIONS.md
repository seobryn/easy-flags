# Granular Feature Permissions System

## Overview

The application now supports granular, role-based feature permissions. This allows administrators to control exactly which features each user role can access, providing better security and feature control.

## Roles

### 1. **Super User** (Role ID: 0)

- Has access to ALL features including system administration tools
- Can access the Database Inspector (`/dev/db-inspector`)
- Should be granted sparingly - only to system administrators
- **Features**: All features

### 2. **Admin** (Role ID: 1)

- Administrator with full access to user management and configuration
- Cannot access Database Inspector (restricted to Super User)
- Can manage all spaces, environments, and feature flags
- **Features**:
  - Feature Flags
  - Spaces
  - Environments
  - Billing
  - Settings
  - API Reference

### 3. **Editor** (Role ID: 2)

- Can modify features, spaces, and environments
- Cannot access billing or settings
- Limited to specific spaces where they have editor role
- **Features**:
  - Feature Flags
  - Spaces
  - Environments
  - API Reference

### 4. **Viewer** (Role ID: 3)

- Read-only access to feature flags
- Cannot make any modifications
- **Features**:
  - Feature Flags
  - API Reference

## Features

The following features are controlled by permissions:

```typescript
FEATURES = {
  FEATURE_FLAGS: "feature_flags", // Create, read, update, delete feature flags
  SPACES: "spaces", // Manage spaces
  ENVIRONMENTS: "environments", // Manage environments
  BILLING: "billing", // Access billing information
  SETTINGS: "settings", // Access system settings
  DATABASE_INSPECTOR: "database_inspector", // Access database inspection tool (Super User only)
  API_REFERENCE: "api_reference", // Access API documentation
};
```

## Database Schema

### `feature_permissions` Table

```sql
CREATE TABLE feature_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  feature_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE(role_id, feature_name)
);
```

## Usage

### In Astro Pages

```typescript
import { isSuperUser, hasFeatureAccess, FEATURES } from "@/utils/permissions";
import { getUserFromContext } from "@/utils/auth";

const user = getUserFromContext(Astro);

// Check if user is super user
if (!isSuperUser(user)) {
  return Astro.redirect("/forbidden");
}

// Check if user has feature access
if (!hasFeatureAccess(user, FEATURES.DATABASE_INSPECTOR)) {
  return Astro.redirect("/forbidden");
}
```

### In API Routes

```typescript
import { checkFeatureAuth, FEATURES } from "@/utils/permissions";

export const POST: APIRoute = async (context) => {
  const { isAuthorized, user } = await checkFeatureAuth(
    context,
    FEATURES.FEATURE_FLAGS,
  );

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Process request
};
```

### Checking Async Permissions

```typescript
import { hasFeatureAccessFromDB, FEATURES } from "@/utils/permissions";

const hasAccess = await hasFeatureAccessFromDB(userId, FEATURES.BILLING);
if (!hasAccess) {
  // Handle unauthorized access
}
```

## API Endpoints

### Get User's Feature Permissions

**GET** `/api/system/features`

Returns the current user's allowed features and roles.

```json
{
  "userId": 1,
  "roleId": 1,
  "isSuperUser": false,
  "allowedFeatures": [
    "feature_flags",
    "spaces",
    "environments",
    "billing",
    "settings",
    "api_reference"
  ],
  "allFeatures": [
    "feature_flags",
    "spaces",
    "environments",
    "billing",
    "settings",
    "database_inspector",
    "api_reference"
  ]
}
```

### Check Feature Access

**POST** `/api/system/features`

```json
{
  "action": "checkFeatureAccess",
  "feature": "database_inspector"
}
```

Response:

```json
{
  "feature": "database_inspector",
  "hasAccess": true,
  "message": "User has access to database_inspector"
}
```

### Get All Permissions

**POST** `/api/system/features` (Super User only)

```json
{
  "action": "getPermissions"
}
```

Response:

```json
{
  "permissions": [
    {
      "roleId": 0,
      "features": [
        "feature_flags",
        "spaces",
        "environments",
        "billing",
        "settings",
        "database_inspector",
        "api_reference"
      ]
    },
    {
      "roleId": 1,
      "features": [
        "feature_flags",
        "spaces",
        "environments",
        "billing",
        "settings",
        "api_reference"
      ]
    }
  ]
}
```

## Database Inspector Access

The Database Inspector (`/dev/db-inspector`) is now **restricted to Super Users only**.

### Current Protection

- ✅ User must be authenticated
- ✅ User must have `role_id = 0` (Super User)
- ✅ Redirects to `/forbidden` if user doesn't have access

### Example

```typescript
// In /src/pages/dev/db-inspector.astro
if (!user || !isSuperUser(user)) {
  return Astro.redirect("/forbidden");
}
```

## Implementing Feature Protection

To protect a new feature or resource:

1. **Add the feature to the `FEATURES` enum** in `src/utils/permissions.ts`
2. **Add default permissions** to `DEFAULT_FEATURE_PERMISSIONS`
3. **Check permissions** in your pages/API routes:

```typescript
// In Astro page
if (!hasFeatureAccess(user, FEATURES.YOUR_NEW_FEATURE)) {
  return Astro.redirect("/forbidden");
}

// In API route
const { isAuthorized } = await checkFeatureAuth(
  context,
  FEATURES.YOUR_NEW_FEATURE,
);
if (!isAuthorized) {
  return new Response(JSON.stringify({ error: "Access denied" }), {
    status: 403,
  });
}
```

5. **Add database entries** for the feature in `feature_permissions` table (done automatically on database initialization)

## Security Notes

- Super User role should be assigned very carefully
- Roles are stored in the database and checked on every request
- Feature permissions are always verified server-side (no client-side-only checks)
- Super Users bypass all feature permission checks
- Database permissions are case-sensitive and must match the FEATURES enum exactly

## Migration Guide

If you have an existing database:

1. No migration needed - new tables are created automatically
2. Existing users will keep their current role_id
3. New roles (SUPER_USER with id 0) will be created
4. Feature permissions will be seeded automatically

## Permission Matrix

| Role       | Feature Flags | Spaces | Environments | Billing | Settings | DB Inspector | API Ref |
| ---------- | ------------- | ------ | ------------ | ------- | -------- | ------------ | ------- |
| Super User | ✅            | ✅     | ✅           | ✅      | ✅       | ✅           | ✅      |
| Admin      | ✅            | ✅     | ✅           | ✅      | ✅       | ❌           | ✅      |
| Editor     | ✅            | ✅     | ✅           | ❌      | ❌       | ❌           | ✅      |
| Viewer     | ✅            | ❌     | ❌           | ❌      | ❌       | ❌           | ✅      |
