# Token Invalidation System

## Overview

This document describes the token invalidation (revocation) system implemented in Easy Flags. This system allows you to revoke all active login sessions for a specific user by invalidating their JWT tokens.

## How It Works

The token revocation system uses a **token versioning** approach:

1. **Token Version Storage**: Each user has a `token_version` field in the database (default: 0)
2. **Token Inclusion**: When a JWT token is issued during login/registration, the current `token_version` is embedded in the token payload
3. **Version Verification**: On each request, the token's embedded version is checked against the user's current database version
4. **Revocation**: When you revoke tokens for a user, their `token_version` is incremented, instantly invalidating all tokens issued before that increment

## Benefits

- **Instant Revocation**: Tokens are revoked immediately without waiting for expiration (24-hour default)
- **No Database Lookup Overhead**: Token contains version info; only checked when needed
- **Secure**: Doesn't require maintaining a blacklist of revoked tokens
- **Simple**: Minimal database schema changes

## Database Changes

A migration has been created to add the necessary column:

```sql
ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0;
```

**Run migrations:**

```bash
npm run db:migrate
```

## API Endpoints

### 1. User Logout with Token Revocation

- **Endpoint**: `POST /api/auth/logout`
- **Authentication**: Required (user must be logged in)
- **Behavior**: Revokes all tokens for the logged-in user and clears the session cookie

```javascript
// Example:
await fetch("/api/auth/logout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});
```

### 2. Super User: Revoke User Tokens

- **Endpoint**: `POST /api/auth/revoke-user-tokens`
- **Authentication**: Required (super user only, role_id = 1)
- **Body**: `{ userId: number }`
- **Behavior**: Revokes all tokens for a specific user (super user action - requires super user privileges)

```javascript
// Example: Super user revoking user ID 5's tokens
const response = await fetch("/api/auth/revoke-user-tokens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: 5 }),
});

// Success Response (200):
// {
//   "success": true,
//   "message": "All tokens revoked for user: john_doe",
//   "userId": 5
// }

// Error Response - Not Super User (403):
// {
//   "success": false,
//   "message": "Only super users can revoke user tokens. This action requires super user privileges."
// }
```

## Implementation Details

### Files Modified

1. **Database**:
   - Migration: `scripts/migrations/006_add_token_version_for_revocation.sql`

2. **Auth Service** (`src/lib/auth-service.ts`):
   - Updated `User` interface to include `token_version`
   - Updated all user queries to select `token_version`
   - Added `revokeUserTokens(userId)` function

3. **Auth Utils** (`src/utils/auth.ts`):
   - Updated `UserPayload` interface to include `token_version`
   - Added `verifyTokenWithVersion()` for explicit version checking
   - Added `getUserFromContextWithVersionCheck()` async function for full verification
   - Added `isSuperUser(user)` helper function to check for super user privileges (role_id = 1)
   - Added `isAdmin(user)` helper function to check for admin or super user privileges (role_id = 1 or 2)

4. **Login/Register** (`src/pages/api/auth/login.ts`, `src/pages/api/auth/register.ts`):
   - Updated token signing to include `token_version` from user object

5. **Logout** (`src/pages/api/auth/logout.ts`):
   - Updated to call `revokeUserTokens()` before clearing the cookie

6. **New Endpoint** (`src/pages/api/auth/revoke-user-tokens.ts`):
   - New super-user-only endpoint for revoking any user's tokens
   - Includes `isSuperUser()` privilege check to ensure only super users (role_id = 1) can execute
   - Returns 403 Forbidden if non-super-user attempts to call this endpoint

7. **UI Component** (`src/components/react/SettingsView.tsx`):
   - Added "Sessions" tab to the settings page
   - User-facing revoke feature: "Revoke All Sessions" button
   - Super user admin panel: "Revoke User Tokens" with user ID/username fields
   - Integrated with existing Tailwind/React UI patterns
   - Includes confirmation dialogs and loading states

## User Interface

### Sessions Tab

The token revocation feature is accessible through the **Settings > Sessions** tab in the web UI.

#### For All Users:

- **Current Session Card**: Displays active session info (status, username, login time)
- **Revoke All Sessions Button**: Revokes all tokens for the logged-in user
  - Orange-themed button with warning message
  - Requires confirmation before execution
  - Shows loading spinner during revocation
  - Auto-redirects to login page after successful revocation

#### For Super Users Only (role_id = 1):

- **Admin Panel**: "Revoke User Tokens" section
  - Red-themed danger zone styling
  - Input fields for User ID and Username (optional)
  - Admin-only button with elevated visual prominence
  - Requires confirmation before execution
  - Returns success message with username confirmation

#### Info Card:

- Educational section explaining how token revocation works
- Lists key benefits and security features

### Accessing the UI

1. Log in to Easy Flags
2. Navigate to **Settings** page
3. Click the **Sessions** tab
4. For users: Click "Revoke All Sessions" (orange button)
5. For super users: Fill in user ID and click "Revoke User Tokens" (red button)

## Usage Scenarios

### Scenario 1: User Self-Logout with Full Revocation

```javascript
// User logs out and wants to revoke all sessions
await fetch("/api/auth/logout", { method: "POST" });
// All tokens issued to this user are now invalid
// Sessions on all devices/browsers are terminated
```

### Scenario 2: Super User Revokes Compromised Account

```javascript
// Only super users can execute this
// Super user suspects account was compromised and revokes all sessions
const response = await fetch("/api/auth/revoke-user-tokens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: 123 }),
});
// All active sessions for user 123 are immediately terminated
// Non-super users will receive 403 Forbidden with error message
```

### Scenario 3: Security-Related Revocation

```javascript
// User password changed - could optionally revoke old tokens
await revokeUserTokens(userId);
// Old tokens are now invalid; user must log in with new password
```

## Token Verification Flow

When a request is made with a token:

1. **Extract Token**: Get JWT from `ff_token` cookie
2. **Verify Signature**: Check JWT signature and expiration (standard JWT verification)
3. **Extract Version**: Read `token_version` from JWT payload
4. **Check Current Version**: Query user's current `token_version` from database
5. **Compare**: If they don't match → token is revoked, request is denied

For most endpoints, step 5 is implicit. For explicit verification, use:

```typescript
import { getUserFromContextWithVersionCheck } from "@/utils/auth";

const user = await getUserFromContextWithVersionCheck(context);
if (!user) {
  return new Response(JSON.stringify(unauthorizedResponse()), {
    status: 401,
  });
}
```

## Notes

- Tokens still expire after 24 hours (configured in `signToken()`)
- Revocation is effective immediately across all devices/sessions
- The system integrates with existing `is_active` user flag (accounts that are deactivated cannot log in)
- Token version is auto-incremented with each revocation using SQL: `token_version = token_version + 1`

## Access Control & Role Requirements

### Super User (role_id = 1)

- Can revoke tokens for any user via the `/api/auth/revoke-user-tokens` endpoint
- This is a **privileged operation** restricted to super users only
- Attempting to call this endpoint with a non-super-user account will result in a 403 Forbidden response

### Role Hierarchy

```
Super User (role_id: 1)  ← Can revoke tokens for ANY user
├─ Admin (role_id: 2)    ← Cannot revoke tokens (requires super user)
├─ Editor (role_id: 3)   ← Cannot revoke tokens (requires super user)
└─ Viewer (role_id: 4)   ← Cannot revoke tokens (requires super user)
```

### Authorization Helper Functions

Utility functions available in `src/utils/auth.ts`:

```typescript
import { isSuperUser, isAdmin } from "@/utils/auth";

const user = getUserFromContext(context);

// Check if user is super user
if (!isSuperUser(user)) {
  return forbiddenResponse();
}

// Check if user is admin or super user
if (!isAdmin(user)) {
  return forbiddenResponse();
}
```

## Security Considerations

✅ **Secure Approach Because**:

- No token blacklist to maintain or synchronize
- Version info is cryptographically signed in JWT
- Can't forge or modify token version in JWT without key
- Scales well as no database lookup is required for every request
- Time-based expiration (24h) still applies
- **Token revocation is restricted to super users only** - prevents unauthorized session termination

## Future Enhancements

1. **Session Management UI**: Show user all active sessions with revoke per-session
2. **Audit Log**: Log token revocation events for compliance
3. **Refresh Token Rotation**: Implement refresh tokens with separate version tracking
4. **Device Fingerprinting**: Revoke tokens from specific devices only
5. **Configurable Expiry**: Allow per-user token expiration times
