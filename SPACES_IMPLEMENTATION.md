# Multi-Tenant Spaces Architecture Implementation

## Overview

This document describes the implementation of multi-tenant architecture using **Spaces** for the Feature Flags API. Each space represents a separate tenant, allowing users to create and manage feature flags, environments, and team members within isolated workspaces.

## Architecture

### Core Concepts

1. **Spaces (Tenants)**: Isolated workspaces where users manage feature flags and environments
2. **Space Users**: relationship between users and spaces with role-based access control
3. **Space-Scoped Resources**: Environments and Features are now space-scoped

### Database Schema

#### New Tables

```sql
-- Spaces table: represents multi-tenant workspaces
CREATE TABLE spaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

-- Space users table: manages user membership and per-space roles
CREATE TABLE space_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(space_id, user_id),
  FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(role_id) REFERENCES roles(id)
);
```

#### Schema Modifications

- `environments` table: Added `space_id` column (nullable for backward compatibility)
- `features` table: Added `space_id` column (nullable for backward compatibility)

### Domain Models

```typescript
export interface Space {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
}

export interface SpaceUser {
  id: number;
  space_id: number;
  user_id: number;
  role_id: number;
  created_at: string;
}
```

## API Endpoints

### Base URL

```
/api/spaces
```

### Space Management

#### Create a new space

```
POST /api/spaces
Content-Type: application/json

{
  "name": "Production Team",
  "description": "Feature flags for production environment"
}

Response: 201 Created
{
  "id": 1,
  "name": "Production Team",
  "description": "Feature flags for production environment",
  "owner_id": 1,
  "created_at": "2026-03-09T10:00:00Z"
}
```

#### Get all spaces for current user

```
GET /api/spaces

Response: 200 OK
[
  {
    "id": 1,
    "name": "Production Team",
    "description": "Feature flags for production environment",
    "owner_id": 1,
    "created_at": "2026-03-09T10:00:00Z"
  },
  ...
]
```

#### Get space details

```
GET /api/spaces/:spaceId

Response: 200 OK
{
  "id": 1,
  "name": "Production Team",
  "description": "Feature flags for production environment",
  "owner_id": 1,
  "created_at": "2026-03-09T10:00:00Z"
}
```

#### Update space (owner only)

```
PUT /api/spaces/:spaceId
Content-Type: application/json

{
  "name": "Updated Production Team",
  "description": "Updated description"
}

Response: 200 OK
{
  "id": 1,
  "name": "Updated Production Team",
  "description": "Updated description",
  "owner_id": 1,
  "created_at": "2026-03-09T10:00:00Z"
}
```

#### Delete space (owner only)

```
DELETE /api/spaces/:spaceId

Response: 200 OK
{
  "success": true
}
```

### Space User Management

#### Add user to space (owner only)

```
POST /api/spaces/:spaceId/users
Content-Type: application/json

{
  "user_id": 2,
  "role_id": 2
}

Response: 201 Created
{
  "id": 1,
  "space_id": 1,
  "user_id": 2,
  "role_id": 2,
  "created_at": "2026-03-09T10:05:00Z"
}
```

#### Get space users

```
GET /api/spaces/:spaceId/users

Response: 200 OK
[
  {
    "id": 1,
    "space_id": 1,
    "user_id": 1,
    "role_id": 1,
    "created_at": "2026-03-09T10:00:00Z"
  },
  {
    "id": 2,
    "space_id": 1,
    "user_id": 2,
    "role_id": 2,
    "created_at": "2026-03-09T10:05:00Z"
  }
]
```

#### Update user role in space (owner only)

```
PUT /api/spaces/:spaceId/users/:userId/role
Content-Type: application/json

{
  "role_id": 1
}

Response: 200 OK
{
  "id": 2,
  "space_id": 1,
  "user_id": 2,
  "role_id": 1,
  "created_at": "2026-03-09T10:05:00Z"
}
```

#### Remove user from space (owner only)

```
DELETE /api/spaces/:spaceId/users/:userId

Response: 200 OK
{
  "success": true
}
```

### Environment Management (Space-scoped)

#### Create environment in space

```
POST /api/spaces/:spaceId/environments
Content-Type: application/json

{
  "name": "staging"
}

Response: 201 Created
{
  "id": 1,
  "name": "staging",
  "space_id": 1
}
```

#### Get environments in space

```
GET /api/spaces/:spaceId/environments

Response: 200 OK
[
  {
    "id": 1,
    "name": "development",
    "space_id": 1
  },
  {
    "id": 2,
    "name": "staging",
    "space_id": 1
  }
]
```

#### Update environment name

```
PUT /api/spaces/:spaceId/environments/:envId
Content-Type: application/json

{
  "name": "staging-v2"
}

Response: 200 OK
{
  "id": 2,
  "name": "staging-v2",
  "space_id": 1
}
```

#### Delete environment

```
DELETE /api/spaces/:spaceId/environments/:envId

Response: 200 OK
{
  "success": true
}
```

### Feature Management (Space-scoped)

#### Create feature in space

```
POST /api/spaces/:spaceId/features
Content-Type: application/json

{
  "key": "DARK_MODE",
  "description": "Dark mode toggle feature"
}

Response: 201 Created
{
  "id": 1,
  "key": "DARK_MODE",
  "description": "Dark mode toggle feature",
  "space_id": 1
}
```

#### Get features in space

```
GET /api/spaces/:spaceId/features

Response: 200 OK
[
  {
    "id": 1,
    "key": "DARK_MODE",
    "description": "Dark mode toggle feature",
    "space_id": 1
  },
  {
    "id": 2,
    "key": "BETA_FEATURE",
    "description": "Beta feature for testing",
    "space_id": 1
  }
]
```

#### Delete feature

```
DELETE /api/spaces/:spaceId/features/:featureId

Response: 200 OK
{
  "success": true
}
```

#### Set feature flag value

```
PUT /api/spaces/:spaceId/features/:featureId/value
Content-Type: application/json

{
  "environmentId": 1,
  "value": true
}

Response: 200 OK
{
  "id": 1,
  "feature_id": 1,
  "environment_id": 1,
  "value": true
}
```

## Authorization & Access Control

### Space Access Middleware

Two middleware functions control access to spaces:

#### `requireSpaceAccess()` - Checks membership

User must be either:

- The space owner
- A member of the space_users table

#### `requireSpaceOwner()` - Checks ownership

User must be:

- The space owner (allowed owner_id in spaces table)

### Role-Based Access

Within a space, users can have different roles:

- **Admin**: Full access to space management
- **Editor**: Can create/modify features and environments
- **Viewer**: Read-only access

Each role is assigned to a user within the context of a specific space.

## Implementation Details

### File Structure

```
src/
├── domain/
│   └── models.ts                    # Updated with Space, SpaceUser interfaces
├── infrastructure/repositories/
│   └── spaceRepository.ts           # NEW: Space data access layer
├── application/services/
│   ├── spaceService.ts              # NEW: Space business logic
│   ├── environmentService.ts        # Updated: space-aware methods
│   └── featureService.ts            # Updated: space-aware methods
├── routes/
│   └── spaceRoutes.ts               # NEW: Space API endpoints
├── authorizationMiddlewares.ts      # Updated: new middleware functions
└── routes.ts                        # Updated: mounted space router

migrations/
└── 002_add_spaces.ts                # NEW: Database schema changes
```

### Service Layer

#### SpaceService

Main service for space management including:

- Create/update/delete spaces
- Add/remove users from spaces
- Update user roles within spaces
- Check space membership and ownership

#### Updated Services

- `EnvironmentService`: Added `listEnvironmentsBySpace()` method
- `FeatureService`: Added `listFeaturesBySpace()` method

### Repository Layer

#### SpaceRepository

Methods for space data operations:

- `create()` - Create new space
- `findById()` - Get space by ID
- `listByUserId()` - Get all spaces for a user
- `addUser()` - Add user to space
- `removeUser()` - Remove user from space
- `getSpaceUsers()` - Get all users in space
- `isUserInSpace()` - Check if user is space member
- `isSpaceOwner()` - Check if user owns space
- `updateUserRole()` - Update user's role within space

#### Updated Repositories

- `EnvironmentRepository`: Added space-aware methods
- `FeatureRepository`: Added space-aware methods

## Migration Steps

To apply these changes to an existing database:

1. Run the new migration:

```bash
npm run migration:create -- --name add_spaces
```

2. This will create the `spaces` and `space_users` tables and add `space_id` columns to existing tables

## Backward Compatibility

The implementation maintains backward compatibility:

- `space_id` columns are nullable
- Existing environments and features continue to work without a space
- Raw global endpoints still available (e.g., `GET /api/features`)

## Migration Path

For existing deployments, users can:

1. Continue using global features/environments (no space_id)
2. Start using spaces to organize new feature flags
3. Gradually migrate existing resources into spaces

## Usage Example

```typescript
// 1. Create a space
POST /api/spaces
{ "name": "My First Space", "description": "Production features" }

// 2. Add team members
POST /api/spaces/1/users
{ "user_id": 2, "role_id": 2 }  // Add editor role

// 3. Create environment in space
POST /api/spaces/1/environments
{ "name": "production" }

// 4. Create feature in space
POST /api/spaces/1/features
{ "key": "NEW_FEATURE", "description": "New cool feature" }

// 5. Set feature value for environment
PUT /api/spaces/1/features/1/value
{ "environmentId": 1, "value": true }

// 6. View all space members
GET /api/spaces/1/users
```

## Testing

All new services and repositories include comprehensive test coverage. Test mocks have been updated to support space-aware methods.

Run tests:

```bash
npm run test
npm run test:coverage
```

## Future Enhancements

Potential future additions:

1. Space-level permissions (different from global permissions)
2. Space billing/quota management
3. Space audit logs
4. Space API keys for external access
5. Space templates for quick setup
6. Space invitations via email
7. Space hierarchy/sub-spaces
