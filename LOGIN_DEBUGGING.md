# Login Debugging Guide

## If Login/Registration Fails

Follow these steps to diagnose the issue:

### 1. **Check Browser Console for Errors**

1. Open your browser
2. Press `F12` to open Developer Tools
3. Click on the "Console" tab
4. Try to login/register again
5. Look for any error messages in red

You should see console logs like:
```
Attempting login with username: admin
Login response status: 200
Login response data: {success: true, data: {user: {...}, token: "..."}}
Login successful, redirecting to spaces...
```

### 2. **Check Network Tab**

1. Open Developer Tools → "Network" tab
2. Try to login/register
3. Look for the `/api/auth/login` or `/api/auth/register` request
4. Click on it and check:
   - **Status**: Should be 200 for success, 400 for validation error
   - **Response**: Should contain `{success: true, data: {...}}` for success
   - **Request**: Should show the JSON payload with username, email, password

### 3. **Common Issues & Solutions**

#### Issue: "Invalid request format"
- **Cause**: Request body is not valid JSON
- **Solution**: Check console for parse errors, verify credentials are being sent

#### Issue: "Username and password are required"
- **Cause**: Missing username or password field
- **Solution**: Make sure both fields are filled

#### Issue: "Username and password cannot be empty"
- **Cause**: Fields contain only whitespace
- **Solution**: Enter actual username and password, not just spaces

#### Issue: "Login failed: [error message]"
- **Cause**: Server error while processing login
- **Cause**: Check the full error message in the browser console

### 4. **Server Logs**

If you're running the dev server, check the terminal output for server-side logs:

```
❌ Login error: [error details]
✅ Login successful for user: username
```

These logs help identify backend issues.

### 5. **Test with curl (Advanced)**

You can test the API directly:

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -v

# Test registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password"}' \
  -v
```

### 6. **Verify Environment**

Check that `.env` is properly configured:

```env
JWT_SECRET=your-secret-key
ADMIN_USER=admin
ADMIN_PASS=password
DATABASE_URL=file:./data.db
```

### 7. **Clear Browser Cache**

Sometimes stale data causes issues:
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Clear cookies and cached data
3. Refresh the page and try again

## Expected Behavior

### Successful Login Flow
1. Enter username and password
2. Click "Sign In"
3. See console logs showing successful response
4. Redirected to `/spaces` page
5. Auth cookie stored in browser

### Successful Registration Flow
1. Enter username, email, password
2. Confirm password
3. Click "Create Account"
4. See console logs showing successful response
5. Redirected to `/spaces` page
6. Auth cookie stored in browser

## Still Having Issues?

1. Check the browser console (F12)
2. Check server logs in terminal
3. Verify all fields are filled correctly
4. Try clearing browser cache
5. Restart the dev server: `npm run dev`

The enhanced error messages should now show exactly what's going wrong!
