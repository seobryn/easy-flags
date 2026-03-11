# Redirect After Login Feature

## Overview

This feature saves the URL where an unauthenticated user was trying to access, and after successful login, redirects them back to that original URL instead of the default `/spaces` page. This provides a better user experience.

## How It Works

### Flow Diagram

```
1. User tries to access: /spaces/123/features
                              ↓
2. Page checks authentication (fails)
                              ↓
3. Redirects to: /login?redirect=%2Fspaces%2F123%2Ffeatures
                              ↓
4. Login form submits with redirect parameter
                              ↓
5. Backend validates redirect URL (security check)
                              ↓
6. Returns redirect URL in login response
                              ↓
7. Frontend redirects user to: /spaces/123/features
```

## Implementation Details

### Components

#### 1. **Redirect URL Validation** (`src/utils/redirect.ts`)

Prevents open redirect attacks by validating URLs:

- ✅ Allows relative URLs (starting with `/`)
- ✅ Allows same-origin absolute URLs
- ❌ Blocks `javascript:` and `data:` URLs
- ❌ Blocks cross-origin URLs

```typescript
import { getSafeRedirectUrl } from "@/utils/redirect";

const safeUrl = getSafeRedirectUrl(userProvidedUrl, "/spaces");
// Returns the URL if valid, or "/spaces" if invalid
```

#### 2. **Auth Redirect Helpers** (`src/utils/auth-redirect.ts`)

Simplifies protected page setup:

```typescript
import { requireAuth, redirectIfAuthenticated } from "@/utils/auth-redirect";

// In protected pages
requireAuth(Astro); // Redirects to /login?redirect=[current-url] if not auth

// In auth pages (login, register)
redirectIfAuthenticated(Astro); // Redirects to /spaces if already auth
```

#### 3. **Login Flow** (`src/pages/api/auth/login.ts`)

- Accepts `redirectUrl` in request body
- Validates it with `getSafeRedirectUrl()`
- Returns sanitized URL in response

#### 4. **Login Form** (`src/components/react/LoginForm.tsx`)

- Accepts `redirectUrl` prop
- Sends it to backend during login
- Receives validated URL in response
- Redirects to it after successful login

#### 5. **Login Page** (`src/pages/login.astro`)

- Extracts redirect parameter from query string
- Passes it to LoginForm component
- Example URL: `/login?redirect=%2Fspaces%2F123%2Ffeatures`

## Usage

### For Protected Pages

Update any Astro page that needs authentication:

```astro
---
import { requireAuth } from "@/utils/auth-redirect";

export const prerender = false;

// Automatically redirects unauthenticated users to /login with redirect parameter
requireAuth(Astro);
---

<!-- Page content -->
```

### For Auth Pages

Use in login/register pages to redirect already-authenticated users:

```astro
---
import { redirectIfAuthenticated } from "@/utils/auth-redirect";

export const prerender = false;

// Redirects authenticated users to /spaces (or custom URL)
redirectIfAuthenticated(Astro, "/spaces");

// Get the redirect parameter if needed
const redirectUrl = Astro.url.searchParams.get("redirect");
---
```

## Examples

### Example 1: User Tries to Access Protected Page

```
1. User clicks link to: /spaces/456/features/78
2. Page is unauthenticated
3. Browser redirects to: /login?redirect=%2Fspaces%2F456%2Ffeatures%2F78
4. User logs in with credentials
5. Backend validates redirect URL
6. Frontend receives redirect URL in response
7. Browser redirects to: /spaces/456/features/78
8. User is now on the page they tried to access!
```

### Example 2: URL Encoding

```
Original URL: /spaces/123/features?tab=advanced
Encoded:      /login?redirect=%2Fspaces%2F123%2Ffeatures%3Ftab%3Dadvanced
```

### Example 3: Invalid Redirect Protection

```javascript
// These will be rejected and default to /spaces:
getSafeRedirectUrl("javascript:alert('XSS')"); // → "/spaces"
getSafeRedirectUrl("//evil.com"); // → "/spaces"
getSafeRedirectUrl("http://evil.com"); // → "/spaces"
getSafeRedirectUrl(""); // → "/spaces"

// These will be allowed:
getSafeRedirectUrl("/spaces/123"); // → "/spaces/123"
getSafeRedirectUrl("/admin/users"); // → "/admin/users"
getSafeRedirectUrl("/dashboard?tab=overview"); // → "/dashboard?tab=overview"
```

## Security Considerations

### Open Redirect Protection

The implementation includes multiple security checks:

1. **URL Validation**: Only relative paths or same-origin URLs are allowed
2. **JavaScript Protocol Blocking**: `javascript:` and `data:` URLs are rejected
3. **Cross-Origin Blocking**: Absolute URLs to different domains are rejected
4. **Whitelist (Optional)**: Can be extended to use an explicit whitelist of allowed paths

### Additional Best Practices Implemented

- ✅ URL encoding/decoding to prevent bypass attacks
- ✅ Sanitization on both client and server
- ✅ Validation before redirecting
- ✅ Fallback to safe default (`/spaces`)

## Files Modified

### New Files

- `src/utils/redirect.ts` - URL validation utilities
- `src/utils/auth-redirect.ts` - Auth redirect helpers

### Updated Files

- `src/pages/api/auth/login.ts` - Added redirect URL handling
- `src/pages/login.astro` - Extract and pass redirect parameter
- `src/components/react/LoginForm.tsx` - Send and handle redirect URL
- `src/pages/create-account.astro` - Added helper import
- All protected pages under `/spaces/*` - Use new helpers
- `src/pages/dev/db-inspector.astro` - Use new helpers

## Testing

### Manual Test Cases

#### Test 1: Redirect After Login

```bash
# 1. In browser, visit a protected page while logged out:
http://localhost:3000/spaces/1/features

# 2. Should redirect to:
http://localhost:3000/login?redirect=%2Fspaces%2F1%2Ffeatures

# 3. Login with credentials
# 4. Should redirect back to:
http://localhost:3000/spaces/1/features
```

#### Test 2: Authentication Already Exists

```bash
# 1. Login to the app
# 2. Visit login page:
http://localhost:3000/login

# 3. Should redirect to:
http://localhost:3000/spaces
```

#### Test 3: Invalid Redirect Prevention

```bash
# 1. Try to visit login with malicious redirect:
http://localhost:3000/login?redirect=javascript:alert('XSS')

# 2. After login, should redirect to safe default:
/spaces
```

#### Test 4: Complex URL Preservation

```bash
# 1. Try to access page with query params:
http://localhost:3000/spaces/1/environments?tab=config&sort=name

# 2. Should redirect to:
http://localhost:3000/login?redirect=%2Fspaces%2F1%2Fenvironments%3Ftab%3Dconfig%26sort%3Dname

# 3. After login, should preserve all parameters:
http://localhost:3000/spaces/1/environments?tab=config&sort=name
```

## Future Enhancements

1. **Whitelist Approach**: Optionally use an explicit list of allowed redirect paths
2. **Analytics**: Track where users were trying to go before login
3. **Deep Linking**: Support deep links in mobile apps
4. **Post-Register Redirect**: Apply same logic to registration flow

## Troubleshooting

### User Not Redirected After Login

**Problem**: User redirects to `/spaces` instead of original URL

**Solutions**:

1. Check if `redirect` parameter is present in login URL: `/login?redirect=...`
2. Verify the redirect URL is valid (not blocked by validation)
3. Check browser console for errors
4. Clear cookies and try again

### Invalid Redirect URL Being Rejected

**Problem**: Valid URL is rejected and defaults to `/spaces`

**Solutions**:

1. Ensure URL is relative (starts with `/`) or same-origin
2. Check for `javascript:` or `data:` protocols
3. Verify URL encoding is correct
4. Check `src/utils/redirect.ts` validation logic

## References

- [OWASP Open Redirect](https://cheatsheetseries.owasp.org/cheatsheets/Open_Redirect_Cheat_Sheet.html)
- [MDN URL Documentation](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [HTML URL Encoding](https://www.w3schools.com/tags/ref_urlencode.asp)
