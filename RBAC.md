# Role-Based Access Control (RBAC) System

## Overview

This application now includes a comprehensive Role-Based Access Control (RBAC) system that allows you to:

- Create and manage user roles
- Define permissions for each role
- Assign roles to users
- Protect routes based on permissions and roles

## Database Schema

### Tables

The RBAC system uses the following database tables:

#### `roles`

```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);
```

#### `permissions`

```sql
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);
```

#### `role_permissions`

```sql
CREATE TABLE role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  UNIQUE(role_id, permission_id),
  FOREIGN KEY(role_id) REFERENCES roles(id),
  FOREIGN KEY(permission_id) REFERENCES permissions(id)
);
```

#### `users` (Updated)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role_id INTEGER,
  FOREIGN KEY(role_id) REFERENCES roles(id)
);
```

## Default Roles and Permissions

The system comes with three pre-defined roles:

### 1. **Admin**

- Full access to all system features
- Permissions: All permissions

### 2. **Editor**

- Can create and manage features and environments
- Permissions:
  - `manage_features`
  - `manage_environments`
  - `manage_flags`
  - `view_features`

### 3. **Viewer**

- Read-only access
- Permissions:
  - `view_features`

### Available Permissions

- `manage_roles` - Create, update, and delete roles
- `manage_permissions` - Manage permissions for roles
- `manage_users` - Create, update, and delete users
- `manage_features` - Create, update, and delete features
- `manage_environments` - Create, update, and delete environments
- `manage_flags` - Update feature flag values
- `view_features` - View features and flag values
- `manage_billing` - Access billing and subscription management

## API Endpoints

### Roles Management

#### List all roles

```bash
GET /api/roles
```

Response:

```json
[
  {
    "id": 1,
    "name": "Admin",
    "description": "Administrator with full access"
  },
  ...
]
```

#### Get role with permissions

```bash
GET /api/roles/:id
```

Response:

```json
{
  "id": 1,
  "name": "Admin",
  "description": "Administrator with full access",
  "permissions": [
    {
      "id": 1,
      "name": "manage_roles",
      "description": "Create, update, and delete roles"
    },
    ...
  ]
}
```

#### Create role

```bash
POST /api/roles
Content-Type: application/json

{
  "name": "Manager",
  "description": "Manager role with limited permissions"
}
```

#### Update role

```bash
PUT /api/roles/:id
Content-Type: application/json

{
  "name": "Manager",
  "description": "Updated description"
}
```

#### Delete role

```bash
DELETE /api/roles/:id
```

#### Set role permissions

```bash
POST /api/roles/:id/permissions
Content-Type: application/json

{
  "permissionIds": [1, 2, 3]
}
```

### Permissions Management

#### List all permissions

```bash
GET /api/permissions
```

Response:

```json
[
  {
    "id": 1,
    "name": "manage_roles",
    "description": "Create, update, and delete roles"
  },
  ...
]
```

#### Get role permissions

```bash
GET /api/permissions/role/:roleId
```

#### Create permission

```bash
POST /api/permissions
Content-Type: application/json

{
  "name": "custom_permission",
  "description": "Custom permission description"
}
```

#### Update permission

```bash
PUT /api/permissions/:id
Content-Type: application/json

{
  "name": "updated_permission",
  "description": "Updated description"
}
```

#### Delete permission

```bash
DELETE /api/permissions/:id
```

### User Role Assignment

#### Assign role to user

```bash
POST /api/users/:id/role/:roleId
```

#### Remove role from user

```bash
DELETE /api/users/:id/role
```

#### List users with roles

```bash
GET /api/users
```

Response:

```json
[
  {
    "id": 1,
    "username": "john_doe",
    "role_id": 1,
    "role": {
      "id": 1,
      "name": "Admin",
      "description": "Administrator with full access"
    }
  },
  ...
]
```

#### Create user with role

```bash
POST /api/users
Content-Type: application/json

{
  "username": "new_user",
  "password": "password123",
  "roleId": 2
}
```

## UI Management

### Manage Roles

1. Navigate to the **Roles** page from the main navigation menu
2. View all existing roles in a table
3. Click **Create Role** to add a new role
4. Click the **edit icon** to modify a role
5. Click the **permissions icon** to manage permissions for a role
6. Click the **delete icon** to remove a role

### Manage Users & Roles

1. Navigate to the **Users** page
2. View all users and their assigned roles
3. Create a new user with a specific role
4. (Extend the UI to allow role assignment changes)

## Authorization Middleware

Two authorization middleware functions are available to protect routes:

### 1. `requirePermission(permission)`

Protects a route based on user permissions.

```typescript
import { requirePermission } from "./authorizationMiddlewares";

// Protect a single endpoint
app.post(
  "/api/special-action",
  authMiddleware,
  requirePermission("manage_features"),
  async (req, res) => {
    // Only users with "manage_features" permission can access this
    res.json({ success: true });
  },
);

// Require one of multiple permissions
app.post(
  "/api/action",
  authMiddleware,
  requirePermission(["manage_features", "manage_flags"]),
  async (req, res) => {
    res.json({ success: true });
  },
);
```

### 2. `requireRole(role)`

Protects a route based on user role.

```typescript
import { requireRole } from "./authorizationMiddlewares";

// Protect a single endpoint
app.delete(
  "/api/users/:id",
  authMiddleware,
  requireRole("Admin"),
  async (req, res) => {
    // Only Admin users can access this
    res.json({ success: true });
  },
);

// Allow one of multiple roles
app.post(
  "/api/config",
  authMiddleware,
  requireRole(["Admin", "Manager"]),
  async (req, res) => {
    res.json({ success: true });
  },
);
```

### 3. `attachUserPermissions()`

Middleware to attach user permissions to the request object for conditional logic.

```typescript
import { attachUserPermissions } from "./authorizationMiddlewares";

app.use(authMiddleware);
app.use(attachUserPermissions);

// In route handler:
app.get("/api/data", async (req, res) => {
  const userPermissions = (req as any).userPermissions; // Array of permission names
  const userRole = (req as any).userRole; // Role ID

  // Conditionally return data based on permissions
  if (userPermissions.includes("manage_features")) {
    // Return sensitive data
  }
  res.json(data);
});
```

## Example: Protecting Routes

Here's an example of how to protect your API routes with the RBAC system:

```typescript
// In src/routes.ts or a specific route file

import {
  requirePermission,
  attachUserPermissions,
} from "./authorizationMiddlewares";

// Protect feature management routes
router.post(
  "/features",
  requirePermission("manage_features"),
  async (req, res) => {
    // Only users with manage_features permission
    res.json({ success: true });
  },
);

router.put(
  "/features/:id",
  requirePermission("manage_features"),
  async (req, res) => {
    res.json({ success: true });
  },
);

router.delete(
  "/features/:id",
  requirePermission("manage_features"),
  async (req, res) => {
    res.json({ success: true });
  },
);

// View-only access
router.get(
  "/features",
  requirePermission("view_features"),
  async (req, res) => {
    res.json(data);
  },
);
```

## Creating Custom Roles and Permissions

### Add a Custom Permission

1. Use the API:

```bash
curl -X POST http://localhost:3000/api/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_action",
    "description": "Custom action description"
  }'
```

2. Or via the Permissions API endpoint

### Create a Custom Role

1. Use the Roles API:

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CustomRole",
    "description": "Custom role description"
  }'
```

2. Assign permissions to the role:

```bash
curl -X POST http://localhost:3000/api/roles/:id/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [1, 2, 3]
  }'
```

3. Assign the role to users:

```bash
curl -X POST http://localhost:3000/api/users/:userId/role/:roleId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## User Workflow

### Assigning Roles to Users

1. Navigate to the **Users** page
2. View all users with their current roles
3. To create a new user with a role, click **Create User** and select a role
4. To change a user's role, use the API endpoint:
   ```bash
   POST /api/users/:userId/role/:roleId
   ```

## Best Practices

1. **Principle of Least Privilege**: Only grant users the permissions they need
2. **Role Hierarchy**: Create roles that match your organizational structure
3. **Regular Audits**: Periodically review user roles and permissions
4. **Default Roles**: Don't delete the default Admin, Editor, and Viewer roles
5. **Permission Naming**: Use descriptive, namespaced permission names (e.g., `manage_features`, `view_analytics`)
6. **Documentation**: Document custom roles and their purposes

## Troubleshooting

### User Has No Role

If a user has no assigned role, they will receive "Insufficient permissions" errors on protected routes.

**Solution**: Assign a role to the user using the `/api/users/:id/role/:roleId` endpoint.

### Permission Denied

Users without the required permission for an action will receive a 403 Forbidden response.

**Solution**: Check the user's role and ensure it has the required permission assigned.

### Database Structure Issues

If you encounter foreign key constraint errors, ensure all tables are properly created and the structure matches the schema above.

## Files Modified/Created

### New Files

- `src/infrastructure/repositories/roleRepository.ts` - Role data access
- `src/infrastructure/repositories/permissionRepository.ts` - Permission data access
- `src/application/services/roleService.ts` - Role business logic
- `src/application/services/permissionService.ts` - Permission business logic
- `src/routes/roleRoutes.ts` - Role API endpoints
- `src/routes/permissionRoutes.ts` - Permission API endpoints
- `src/authorizationMiddlewares.ts` - Permission and role checking middleware
- `views/roles.ejs` - Roles management UI
- `public/js/roles.js` - Roles management frontend logic

### Modified Files

- `src/domain/models.ts` - Added Role, Permission, and RolePermission interfaces
- `src/db.ts` - Added role, permission, and role_permission tables with seed data
- `src/infrastructure/repositories/userRepository.ts` - Added role-related methods
- `src/application/services/userService.ts` - Added role assignment methods
- `src/routes/userRoutes.ts` - Added role assignment endpoints
- `src/routes.ts` - Integrated new route managers
- `src/index.ts` - Added roles page route
- `views/partials/header.ejs` - Added Roles navigation link

## Next Steps

1. **Integrate Authorization Middleware**: Add permission checks to existing API routes
2. **UI Enhancements**: Create forms to manage role assignments in the Users page
3. **Audit Logging**: Track role and permission changes
4. **Advanced Features**: Implement dynamic permissions, permission inheritance, or role templates
