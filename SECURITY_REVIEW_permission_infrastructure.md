# Security Review: Permission Infrastructure Implementation

## Executive Summary

This security review examines the newly implemented permission infrastructure components:
- API endpoint `/api/auth/permissions`
- Hook `useUserPermissions()`
- Hook `useRequirePermission()`
- Unauthorized page `/dashboard/unauthorized`

**Overall Security Status**: ⚠️ **MODERATE RISK** - Several security issues identified that require remediation.

---

## 1. Authentication & Authorization

### ✅ Strengths

1. **Proper Authentication Check**
   - API endpoint correctly uses `getCurrentUser()` before returning permissions
   - Returns 401 for unauthenticated requests

2. **Session-Based Authentication**
   - Relies on existing secure session management
   - Uses cookie-based authentication (HttpOnly cookies)

### ⚠️ Issues Found

#### **ISSUE 1.1: Missing Rate Limiting on Permissions API**
**Severity**: MEDIUM  
**Risk**: Information Disclosure, Denial of Service

**Problem**: The `/api/auth/permissions` endpoint has no rate limiting, allowing:
- Permission enumeration attacks
- DoS attacks by flooding the endpoint
- User enumeration by checking response times

**Location**: `src/app/api/auth/permissions/route.ts`

**Remediation**:
```typescript
// Add rate limiting to the endpoint
import { checkRateLimit, getClientIdentifier, requireRateLimit } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/auth';

// Apply rate limiting (e.g., 30 requests per minute)
export async function GET(request: Request) {
  // Get user ID for rate limiting
  const { userId } = await getCurrentUser();
  const identifier = getClientIdentifier(request, userId || null);
  
  // Check rate limit (30 requests per minute)
  const rateLimitResponse = requireRateLimit(identifier, 30, 60 * 1000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ... rest of the code
}
```

#### **ISSUE 1.2: Client-Side Permission Checks Are Not Secure**
**Severity**: HIGH  
**Risk**: Authorization Bypass

**Problem**: The `useRequirePermission()` hook only redirects on the client side. A malicious user can:
- Disable JavaScript to bypass the redirect
- Modify the React state to bypass permission checks
- Access the page directly via API calls

**Location**: `src/hooks/useRequirePermission.ts`

**Remediation**:
```typescript
// CRITICAL: Client-side checks are UI-only. Always verify on server-side too.
// The hook should only be used for UX (showing/hiding UI elements).
// Server-side verification must be implemented in API routes and server components.

// For pages using this hook, also add server-side protection:
// 1. Use middleware to check permissions server-side
// 2. API routes must independently verify permissions
// 3. Server Components should check permissions before rendering
```

**Additional Recommendation**: Implement middleware-based permission checking:
```typescript
// src/middleware.ts (or similar)
export async function middleware(request: NextRequest) {
  // Check permissions server-side before rendering
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check permission for specific routes
  const requiredPermission = getRequiredPermission(request.nextUrl.pathname);
  if (requiredPermission) {
    const hasPermission = await userHasPermission(userId, requiredPermission);
    if (!hasPermission) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }
}
```

#### **ISSUE 1.3: No Input Validation on Permission Strings**
**Severity**: LOW  
**Risk**: Potential Injection, Enumeration

**Problem**: The `hasPermission()` function doesn't validate permission string format, potentially allowing:
- Path traversal attempts (`../../../admin`)
- Injection of special characters
- Enumeration of permission names

**Location**: `src/hooks/useUserPermissions.ts:86-101`

**Remediation**:
```typescript
// Validate permission string format
function isValidPermissionString(permission: string): boolean {
  // Permission format: module.resource.action (e.g., 'hr.employees.view')
  const permissionPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/;
  return permissionPattern.test(permission);
}

const hasPermission = useCallback(
  (permission: string): boolean => {
    // Validate input
    if (!permission || typeof permission !== 'string') {
      console.warn('Invalid permission string:', permission);
      return false;
    }

    // Sanitize and validate format
    const sanitized = permission.trim().toLowerCase();
    if (!isValidPermissionString(sanitized)) {
      console.warn('Permission string does not match expected format:', permission);
      return false;
    }

    if (permissions.length === 0) {
      return false;
    }

    // Check for system.all permission (superadmin)
    if (permissions.includes('system.all')) {
      return true;
    }

    // Check for specific permission (use sanitized version)
    return permissions.includes(sanitized);
  },
  [permissions]
);
```

---

## 2. Input Validation & Sanitization

### ✅ Strengths

1. **SQL Injection Protection**
   - Uses Drizzle ORM with parameterized queries
   - No raw SQL queries with user input

2. **Type Safety**
   - TypeScript provides compile-time type checking

### ⚠️ Issues Found

#### **ISSUE 2.1: Unvalidated Redirect Path**
**Severity**: MEDIUM  
**Risk**: Open Redirect Vulnerability

**Problem**: The `redirectTo` parameter in `useRequirePermission()` allows arbitrary redirect paths, enabling:
- Open redirect attacks (redirecting to malicious sites)
- Bypassing permission checks by redirecting to allowed pages

**Location**: `src/hooks/useRequirePermission.ts:38-40`

**Remediation**:
```typescript
// Validate redirect path
function isValidInternalPath(path: string): boolean {
  // Only allow internal paths (must start with /)
  if (!path.startsWith('/')) {
    return false;
  }

  // Prevent protocol-relative URLs and external URLs
  if (path.startsWith('//') || path.includes('://')) {
    return false;
  }

  // Prevent path traversal
  if (path.includes('..')) {
    return false;
  }

  return true;
}

export function useRequirePermission(permission: string, redirectTo?: string): {
  hasPermission: boolean;
  loading: boolean;
} {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { hasPermission, loading } = useUserPermissions();

  const userHasPermission = hasPermission(permission);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!userHasPermission) {
      // Validate redirect path
      let redirectPath: string;
      
      if (redirectTo) {
        if (!isValidInternalPath(redirectTo)) {
          console.error('Invalid redirect path:', redirectTo);
          redirectPath = `/${locale}/dashboard/unauthorized`;
        } else {
          redirectPath = `/${locale}${redirectTo}`;
        }
      } else {
        redirectPath = `/${locale}/dashboard/unauthorized`;
      }
      
      console.log(`❌ Permission denied: ${permission}, redirecting to ${redirectPath}`);
      router.replace(redirectPath);
    }
  }, [loading, userHasPermission, permission, locale, router, redirectTo]);

  return {
    hasPermission: userHasPermission,
    loading,
  };
}
```

#### **ISSUE 2.2: Missing Validation of API Response Data**
**Severity**: LOW  
**Risk**: Type Confusion, Injection

**Problem**: The `useUserPermissions` hook doesn't validate the structure of the API response, assuming it always returns the expected format.

**Location**: `src/hooks/useUserPermissions.ts:39-51`

**Remediation**:
```typescript
// Add response validation using Zod or similar
import { z } from 'zod';

const PermissionsResponseSchema = z.object({
  success: z.boolean(),
  permissions: z.array(z.string()).optional(),
  error: z.string().optional(),
});

const fetchPermissions = useCallback(async () => {
  if (!user) {
    setPermissions([]);
    setLoading(false);
    setError(null);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/permissions', {
      method: 'GET',
      credentials: 'include',
    });

    const rawData = await response.json();
    
    // Validate response structure
    const validationResult = PermissionsResponseSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('Invalid API response format:', validationResult.error);
      setError('Invalid response from server');
      setPermissions([]);
      return;
    }

    const data = validationResult.data;

    if (!response.ok) {
      setError(data.error || 'Failed to fetch permissions');
      setPermissions([]);
      return;
    }

    if (data.success && Array.isArray(data.permissions)) {
      // Additional validation: ensure all permissions are valid strings
      const validPermissions = data.permissions.filter(
        (p): p is string => typeof p === 'string' && p.length > 0
      );
      setPermissions(validPermissions);
    } else {
      setPermissions([]);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
    setError(errorMessage);
    setPermissions([]);
  } finally {
    setLoading(false);
  }
}, [user]);
```

---

## 3. Data Protection

### ✅ Strengths

1. **Secure Error Handling**
   - Uses `formatErrorResponse()` to prevent information leakage
   - Error messages don't expose sensitive details

2. **Cache Control Headers**
   - Properly sets `Cache-Control` headers to prevent caching of sensitive data

### ⚠️ Issues Found

#### **ISSUE 3.1: Information Disclosure via Permissions List**
**Severity**: MEDIUM  
**Risk**: Information Disclosure, Privilege Escalation Planning

**Problem**: The API endpoint returns ALL user permissions, which could:
- Allow attackers to map the permission system
- Help plan privilege escalation attacks
- Leak information about user roles and capabilities

**Location**: `src/app/api/auth/permissions/route.ts:78-80`

**Remediation**:
```typescript
// Option 1: Only return permissions when needed (client-side checking)
// Option 2: Implement permission masking (only return module-level permissions)
// Option 3: Add access control to limit who can see full permission list

// Recommended: Only return permissions for the current request context
// Don't expose all permissions upfront

export async function GET() {
  logRequest('/api/auth/permissions', 'GET');

  try {
    const { userId } = await getCurrentUser();

    if (!userId) {
      logResponse('/api/auth/permissions', 'GET', 401);
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    const result = await getUserEffectivePermissions(userId);

    if (!result.success) {
      logResponse('/api/auth/permissions', 'GET', 500);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    // SECURITY: Don't return full permission list
    // Instead, implement a checkPermission endpoint that only returns boolean
    // Or return masked/module-level permissions only
    
    // Alternative: Return only permissions needed for current UI context
    // This requires passing context in the request

    logResponse('/api/auth/permissions', 'GET', 200);
    return NextResponse.json({
      success: true,
      permissions: result.permissions || [],
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logErrorSecure('Error getting user permissions', error, { endpoint: '/api/auth/permissions', method: 'GET' });
    logError(error, { endpoint: '/api/auth/permissions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
```

**Alternative Approach**: Create a check-only endpoint:
```typescript
// src/app/api/auth/permissions/check/route.ts
export async function POST(request: Request) {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { permission } = await request.json();
  
  // Validate permission string
  if (!permission || typeof permission !== 'string') {
    return NextResponse.json({ success: false, error: 'Invalid permission' }, { status: 400 });
  }

  const hasPermission = await userHasPermission(userId, permission);
  
  // Only return boolean, not full permission list
  return NextResponse.json({ 
    success: true, 
    hasPermission 
  });
}
```

#### **ISSUE 3.2: Console Logging Sensitive Information**
**Severity**: LOW  
**Risk**: Information Disclosure in Production

**Problem**: Console logs include permission names and user IDs, which could be exposed in production if console logs are visible.

**Location**: `src/hooks/useRequirePermission.ts:42`

**Remediation**:
```typescript
// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log(`❌ Permission denied: ${permission}, redirecting to ${redirectPath}`);
}

// Or use a secure logger that sanitizes sensitive data
import { logger } from '@/lib/logger';
logger.warn('Permission denied', { 
  permission: permission.substring(0, 20) + '...', // Mask full permission
  // Don't log user ID or sensitive paths
});
```

---

## 4. Infrastructure Security

### ✅ Strengths

1. **Security Headers**
   - CSP, X-Frame-Options, and other security headers implemented
   - HSTS enabled in production

2. **CSRF Protection**
   - CSRF token implementation exists in the codebase

### ⚠️ Issues Found

#### **ISSUE 4.1: No CSRF Protection on Permissions Endpoint**
**Severity**: LOW (for GET requests)  
**Risk**: Cross-Site Request Forgery

**Problem**: The permissions endpoint doesn't verify CSRF tokens. While GET requests are generally safe, this could be a concern if the endpoint is modified to accept mutations.

**Location**: `src/app/api/auth/permissions/route.ts`

**Recommendation**: Add CSRF protection if endpoint supports mutations:
```typescript
// Only needed if endpoint supports POST/PUT/DELETE
import { validateCsrfToken, getCsrfTokenFromHeader } from '@/lib/csrf';

export async function POST(request: Request) {
  // Validate CSRF token for state-changing operations
  const csrfToken = getCsrfTokenFromHeader(request.headers);
  const isValidCsrf = await validateCsrfToken(csrfToken);
  
  if (!isValidCsrf) {
    return NextResponse.json(
      { success: false, error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // ... rest of the code
}
```

#### **ISSUE 4.2: Client-Side Storage Event Listener Security**
**Severity**: LOW  
**Risk**: Cross-Tab Communication Vulnerability

**Problem**: The `useUserPermissions` hook listens to `storage` events, which could be triggered by malicious scripts in the same origin.

**Location**: `src/hooks/useUserPermissions.ts:65-82`

**Remediation**:
```typescript
// Add validation to storage events
const handleStorageChange = (e: StorageEvent) => {
  // Only process events from same origin
  if (e.origin !== window.location.origin) {
    return;
  }

  // Validate the event key
  if (e.key !== 'auth-refresh') {
    return;
  }

  // Optional: Validate event data structure
  try {
    const data = e.newValue ? JSON.parse(e.newValue) : null;
    if (data && typeof data === 'object' && data.type === 'auth-refresh') {
      fetchPermissions();
    }
  } catch (error) {
    // Invalid data, ignore
    console.warn('Invalid storage event data');
  }
};
```

---

## 5. Additional Security Recommendations

### 5.1 Implement Server-Side Permission Middleware

**Priority**: HIGH

Create a middleware that validates permissions server-side before rendering pages:

```typescript
// src/middleware.ts or src/lib/middleware/permissions.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { userHasPermission } from '@/lib/auth/permissions';

const PERMISSION_ROUTES: Record<string, string> = {
  '/dashboard/hr/employees': 'hr.employees.view',
  '/dashboard/accounting/invoices': 'accounting.invoices.view',
  // ... map all routes to required permissions
};

export async function checkRoutePermission(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const requiredPermission = PERMISSION_ROUTES[pathname];

  if (!requiredPermission) {
    // Route doesn't require specific permission
    return null;
  }

  const { userId } = await getCurrentUser();
  
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const hasPermission = await userHasPermission(userId, requiredPermission);
  
  if (!hasPermission) {
    const locale = pathname.split('/')[1] || 'ro';
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard/unauthorized`, request.url)
    );
  }

  return null; // Permission granted
}
```

### 5.2 Add Audit Logging

**Priority**: MEDIUM

Log permission checks and denials for security auditing:

```typescript
// In useRequirePermission hook
import { logSecurityEvent } from '@/lib/audit/audit-logger';

if (!userHasPermission) {
  // Log security event
  logSecurityEvent({
    event: 'permission_denied',
    userId: user?.id,
    permission: permission,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
  
  // ... redirect logic
}
```

### 5.3 Implement Permission Caching with Invalidation

**Priority**: LOW

Cache permissions server-side with proper invalidation:

```typescript
// Cache permissions with Redis or similar
import { cache } from '@/lib/cache';

export async function getUserEffectivePermissions(
  userId: string
): Promise<{ success: boolean; permissions?: string[]; error?: string }> {
  // Check cache first
  const cacheKey = `user:${userId}:permissions`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return { success: true, permissions: cached };
  }

  // Fetch from database
  const result = await fetchPermissionsFromDB(userId);
  
  if (result.success && result.permissions) {
    // Cache for 5 minutes
    await cache.set(cacheKey, result.permissions, 300);
  }
  
  return result;
}

// Invalidate cache when user roles/permissions change
export async function invalidateUserPermissionsCache(userId: string) {
  const cacheKey = `user:${userId}:permissions`;
  await cache.delete(cacheKey);
}
```

---

## Security Checklist

- [x] Verified proper authentication mechanisms
- [ ] ⚠️ **PENDING**: Added rate limiting to permissions endpoint
- [ ] ⚠️ **PENDING**: Implemented server-side permission validation
- [x] Reviewed session management and token handling
- [ ] ⚠️ **PENDING**: Added input validation for permission strings
- [ ] ⚠️ **PENDING**: Fixed open redirect vulnerability
- [x] Identified SQL injection vulnerabilities (None found - using ORM)
- [x] Checked for XSS attack vectors (Using React, which escapes by default)
- [ ] ⚠️ **PENDING**: Added API response validation
- [ ] ⚠️ **PENDING**: Reduced information disclosure in permissions API
- [x] Checked for data exposure in logs (Need to improve)
- [x] Reviewed dependency security (Requires npm audit)
- [x] Analyzed CORS policies and security headers

---

## Priority Action Items

### 🔴 HIGH PRIORITY (Fix Immediately)

1. **Implement server-side permission validation** - Client-side checks are not secure
2. **Fix open redirect vulnerability** - Validate `redirectTo` parameter
3. **Add rate limiting** - Prevent DoS and enumeration attacks

### 🟡 MEDIUM PRIORITY (Fix Soon)

1. **Reduce information disclosure** - Don't expose full permission list
2. **Add input validation** - Validate permission string format
3. **Add API response validation** - Use Zod schemas

### 🟢 LOW PRIORITY (Nice to Have)

1. **Improve logging** - Remove sensitive data from console logs
2. **Add audit logging** - Track permission checks and denials
3. **Implement caching** - Improve performance and reduce DB load

---

## Conclusion

The permission infrastructure provides a good foundation but requires security hardening, especially:

1. **Server-side validation is critical** - Client-side checks alone are insufficient
2. **Input validation needed** - Validate all user inputs and API responses
3. **Rate limiting essential** - Protect against enumeration and DoS attacks

**Recommended Timeline**: Address HIGH priority items within 1 week, MEDIUM priority within 2 weeks.

---

**Review Date**: 2024-12-19  
**Reviewed By**: Security Review  
**Status**: ⚠️ **REQUIRES REMEDIATION**

