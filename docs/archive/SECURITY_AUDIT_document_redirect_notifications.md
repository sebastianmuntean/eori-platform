# Security Audit: Document Redirect Notifications

## Overview

This security audit evaluates the implementation of document redirect notifications in `src/app/api/registratura/general-register/[id]/route.ts` for potential vulnerabilities and security issues.

**Date:** 2024
**Scope:** Document redirect notification functionality
**Files Audited:**
- `src/app/api/registratura/general-register/[id]/route.ts`

---

## Executive Summary

**Overall Security Status:** 🟡 **MEDIUM RISK** - Several security concerns identified

**Critical Issues:** 1
**High Priority Issues:** 2
**Medium Priority Issues:** 3
**Low Priority Issues:** 2

---

## 🔴 Critical Security Issues

### 1. Missing Authorization Checks for Document Access

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:347-500`

**Severity:** 🔴 **CRITICAL**

**Issue:**
The PATCH endpoint only checks for authentication (`getCurrentUser()`), but does NOT verify that:
1. The user has permission to update documents in the registratura module
2. The user has access to the specific document (parish-based access control)
3. The user has permission to redirect documents to other users

**Current Code:**
```typescript
const { userId } = await getCurrentUser();
if (!userId) {
  return NextResponse.json(
    { success: false, error: 'Not authenticated' },
    { status: 401 }
  );
}
// No authorization check after this!
```

**Attack Scenario:**
1. Any authenticated user can redirect any document, regardless of:
   - Whether they created it
   - Whether they have access to the parish
   - Whether they have the necessary permissions
2. Users could spam notifications by redirecting documents repeatedly
3. Users could redirect documents they shouldn't have access to

**Evidence:**
- Other endpoints in the codebase use `checkPermission()` and `requireParishAccess()`
- Example: `src/app/api/registratura/general-register/[id]/resolve/route.ts` checks permissions
- Example: `src/app/api/pilgrimages/[id]/documents/route.ts` checks both permissions and parish access

**Recommendation:**
```typescript
import { checkPermission } from '@/lib/auth';
import { requireParishAccess } from '@/lib/api-utils/authorization';

// After authentication check
const { userId } = await getCurrentUser();
if (!userId) {
  return NextResponse.json(
    { success: false, error: 'Not authenticated' },
    { status: 401 }
  );
}

// Check permission to update documents
const hasPermission = await checkPermission('registratura:update');
if (!hasPermission) {
  return NextResponse.json(
    { success: false, error: 'Insufficient permissions to update documents' },
    { status: 403 }
  );
}

// Check document exists and user has access to its parish
const [document] = await db
  .select()
  .from(generalRegister)
  .where(eq(generalRegister.id, id))
  .limit(1);

if (!document) {
  return NextResponse.json(
    { success: false, error: 'Document not found' },
    { status: 404 }
  );
}

// Check parish access (if document has parishId)
if (document.parishId) {
  try {
    await requireParishAccess(document.parishId, false); // false = read access sufficient
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this document' },
        { status: 403 }
      );
    }
    throw error;
  }
}

// Additional check: Only allow redirecting if user is creator OR has special permission
const isCreator = document.createdBy === userId;
const canRedirectAny = await checkPermission('registratura:redirect_any');

if (data.solutionStatus === 'redirected' && !isCreator && !canRedirectAny) {
  return NextResponse.json(
    { success: false, error: 'Only document creator can redirect documents' },
    { status: 403 }
  );
}
```

**Priority:** 🔴 **CRITICAL** - Fix immediately

---

## 🟡 High Priority Issues

### 2. Potential XSS in Notification Messages

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:260-265`

**Severity:** 🟡 **HIGH** (Mitigated but not eliminated)

**Issue:**
The `documentSubject` is inserted directly into the notification message without HTML sanitization. While React escapes by default, if the frontend uses `dangerouslySetInnerHTML` or if the notification system renders HTML, this could lead to XSS.

**Current Code:**
```typescript
message: NOTIFICATION_MESSAGES.documentRedirected(truncatedSubject),
// Where truncatedSubject comes from documentSubject in database
```

**Attack Scenario:**
1. Attacker creates/updates a document with subject: `<script>alert('XSS')</script>`
2. Document is redirected
3. Notification message contains the script tag
4. If frontend renders without proper escaping → XSS

**Current Protection:**
- ✅ React escapes HTML by default in JSX
- ✅ Text is truncated (limits attack surface)
- ⚠️ No explicit sanitization on backend
- ⚠️ Frontend should be verified to not use `dangerouslySetInnerHTML`

**Recommendation:**
1. **Backend Sanitization (Recommended):**
```typescript
import { sanitizeString } from '@/lib/middleware/validation'; // If exists
// Or use a library like DOMPurify (server-side)

function sanitizeForNotification(text: string): string {
  // Remove HTML tags and escape special characters
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// In createDocumentRedirectNotification:
const sanitizedSubject = sanitizeForNotification(truncatedSubject);
message: NOTIFICATION_MESSAGES.documentRedirected(sanitizedSubject),
```

2. **Frontend Verification:**
- Verify `NotificationsList.tsx` doesn't use `dangerouslySetInnerHTML`
- Ensure React's default escaping is used

**Priority:** 🟡 **HIGH** - Add sanitization as defense-in-depth

---

### 3. Information Disclosure in Logs

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:327-340`

**Severity:** 🟡 **HIGH** (Low impact but violates security best practices)

**Issue:**
Console logs include sensitive information:
- Document IDs
- User IDs
- Error details that could reveal system internals

**Current Code:**
```typescript
console.log(
  `✓ Created ${notificationsToCreate.length} notification(s) for document redirect (documentId: ${documentId})`
);

console.log(`⚠️ Invalid user IDs found: ${invalidUserIds.join(', ')}`);
```

**Attack Scenario:**
1. Logs might be exposed in:
   - Browser console (if using client-side logging)
   - Server logs accessible to developers
   - Error tracking services (Sentry, etc.)
2. Attacker could enumerate:
   - Valid document IDs
   - Valid user IDs
   - System architecture details

**Recommendation:**
```typescript
// Use structured logging with sanitization
console.log({
  event: 'notifications_created',
  count: notificationsToCreate.length,
  // Don't log documentId in production
  // documentId: process.env.NODE_ENV === 'development' ? documentId : '[REDACTED]',
});

// For error logs, use logError which should handle sanitization
logError(error, { 
  endpoint: '/api/registratura/general-register/[id]', 
  method: 'PATCH',
  context: 'sendDocumentRedirectNotifications',
  // Only include IDs in development
  ...(process.env.NODE_ENV === 'development' && {
    documentId,
    userIdCount: validUserIds.length,
  }),
});
```

**Priority:** 🟡 **HIGH** - Sanitize logs in production

---

## 🟠 Medium Priority Issues

### 4. No Rate Limiting on Notification Creation

**Location:** `src/app/api/registratura/general-register/[id]/route.ts`

**Severity:** 🟠 **MEDIUM**

**Issue:**
While there's a batch size limit (100 users), there's no rate limiting on:
- How often a user can redirect documents
- Total notifications created per user per time period

**Attack Scenario:**
1. Attacker redirects document to 100 users
2. Immediately redirects another document to 100 users
3. Repeats rapidly
4. Creates notification spam and database load

**Current Protection:**
- ✅ Batch size limited to 100
- ❌ No rate limiting per user/time period
- ❌ No rate limiting on API endpoint

**Recommendation:**
```typescript
// Implement rate limiting (consider using a library like 'rate-limiter-flexible')
import { RateLimiter } from 'rate-limiter-flexible';

const redirectLimiter = new RateLimiter({
  points: 10, // 10 redirects
  duration: 60, // per 60 seconds
});

// In PATCH handler:
if (data.solutionStatus === 'redirected') {
  try {
    await redirectLimiter.consume(userId);
  } catch (rejRes) {
    return NextResponse.json(
      { success: false, error: 'Too many redirect requests. Please try again later.' },
      { status: 429 }
    );
  }
}
```

**Priority:** 🟠 **MEDIUM** - Implement rate limiting

---

### 5. Missing Input Validation on Document ID Parameter

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:352`

**Severity:** 🟠 **MEDIUM** (Mitigated by Drizzle ORM)

**Issue:**
The document ID from URL params is used directly without UUID format validation. While Drizzle ORM prevents SQL injection, invalid UUIDs cause unnecessary database queries.

**Current Code:**
```typescript
const { id } = await params;
// No UUID validation before query
const [document] = await db
  .select()
  .from(generalRegister)
  .where(eq(generalRegister.id, id))
  .limit(1);
```

**Recommendation:**
```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid();

// At the start of PATCH handler:
const { id } = await params;

// Validate UUID format
try {
  uuidSchema.parse(id);
} catch {
  return NextResponse.json(
    { success: false, error: 'Invalid document ID format' },
    { status: 400 }
  );
}
```

**Priority:** 🟠 **MEDIUM** - Add UUID validation for better error messages and performance

---

### 6. No Validation of Target Users for Notification Spam Prevention

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:478-486`

**Severity:** 🟠 **MEDIUM**

**Issue:**
There's no check to prevent:
1. Redirecting to the same user multiple times
2. Redirecting to inactive users
3. Redirecting to users who shouldn't receive notifications

**Current Code:**
```typescript
if (data.solutionStatus === 'redirected' && validUserIds.length > 0) {
  await sendDocumentRedirectNotifications(...);
}
// No check for duplicate users, inactive users, etc.
```

**Recommendation:**
```typescript
// In sendDocumentRedirectNotifications or before calling it:
async function validateTargetUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  // Get user details including active status
  const targetUsers = await db
    .select({ 
      id: users.id, 
      isActive: users.isActive 
    })
    .from(users)
    .where(inArray(users.id, userIds));

  // Filter out inactive users
  const activeUserIds = targetUsers
    .filter(user => user.isActive)
    .map(user => user.id);

  // Remove duplicates
  const uniqueUserIds = Array.from(new Set(activeUserIds));

  if (uniqueUserIds.length !== userIds.length) {
    console.warn(
      `⚠️ Filtered out ${userIds.length - uniqueUserIds.length} invalid/inactive users`
    );
  }

  return uniqueUserIds;
}

// Before sending notifications:
const validActiveUserIds = await validateTargetUsers(validUserIds);
if (data.solutionStatus === 'redirected' && validActiveUserIds.length > 0) {
  await sendDocumentRedirectNotifications(...);
}
```

**Priority:** 🟠 **MEDIUM** - Validate target users before notifying

---

## 🟢 Low Priority Issues

### 7. Missing CSRF Protection

**Location:** `src/app/api/registratura/general-register/[id]/route.ts:347`

**Severity:** 🟢 **LOW** (Next.js provides some protection, but explicit tokens recommended)

**Issue:**
PATCH endpoint doesn't explicitly verify CSRF tokens. While Next.js App Router provides some protection via SameSite cookies, explicit CSRF tokens are recommended for state-changing operations.

**Recommendation:**
Implement CSRF token validation for PATCH/POST/DELETE endpoints:
```typescript
import { validateCsrfToken } from '@/lib/security/csrf';

// In PATCH handler:
const csrfToken = request.headers.get('X-CSRF-Token');
if (!csrfToken || !await validateCsrfToken(csrfToken, userId)) {
  return NextResponse.json(
    { success: false, error: 'Invalid CSRF token' },
    { status: 403 }
  );
}
```

**Priority:** 🟢 **LOW** - Next.js provides basic protection, but explicit tokens are better

---

### 8. Error Messages May Leak Information

**Location:** Throughout the file

**Severity:** 🟢 **LOW**

**Issue:**
Some error messages might reveal system details:
- "Document not found" vs "You do not have access to this document"
- Could help attackers enumerate documents

**Current Protection:**
- ✅ Generic error messages mostly
- ⚠️ Could be more generic in some cases

**Recommendation:**
Use consistent, generic error messages that don't reveal whether resources exist:
```typescript
// Instead of:
{ success: false, error: 'Document not found' }

// Use:
{ success: false, error: 'Document not found or access denied' }
```

**Priority:** 🟢 **LOW** - Minor information disclosure

---

## ✅ Security Strengths

### SQL Injection Protection ✅

**Status:** **SECURE**

- All database queries use Drizzle ORM
- No raw SQL with user input
- Parameterized queries prevent SQL injection
- UUID validation (via Zod schema) adds extra layer

**Example:**
```typescript
// ✅ Safe - uses Drizzle ORM
const validUsers = await db
  .select({ id: users.id })
  .from(users)
  .where(inArray(users.id, userIds));

// ✅ Safe - parameterized
await db.insert(notifications).values(notificationsToCreate);
```

---

### Authentication ✅

**Status:** **SECURE**

- All endpoints require authentication via `getCurrentUser()`
- Returns 401 if not authenticated
- Session-based authentication (secure)

---

### Input Validation ✅

**Status:** **MOSTLY SECURE**

- Comprehensive Zod schema validation
- UUID validation for user IDs
- String length limits (subject max 500 chars)
- Enum validation for solutionStatus

**Improvements Needed:**
- UUID validation for document ID parameter (see issue #5)

---

### Batch Size Limiting ✅

**Status:** **SECURE**

- Maximum 100 notifications per batch
- Prevents DoS via large batches
- Warning logged when limit exceeded

---

### Error Handling ✅

**Status:** **SECURE**

- Errors are caught and logged
- Generic error messages returned to client
- No stack traces exposed
- Notification failures don't break document updates

---

## Security Checklist

- [x] Dependencies secure (Drizzle ORM, Zod - both secure)
- [x] No hardcoded secrets
- [x] Input validation implemented (Zod schemas)
- [x] Authentication secure (session-based)
- [ ] **Authorization properly configured** ⚠️ **MISSING**
- [x] SQL injection protected (Drizzle ORM)
- [ ] XSS protection (React escapes, but no backend sanitization) ⚠️
- [ ] Rate limiting implemented ⚠️ **PARTIAL** (batch limit only)
- [x] Error messages don't leak sensitive info (mostly)
- [ ] CSRF protection (Next.js default, but explicit tokens recommended) ⚠️

---

## Remediation Priority

### Immediate (Critical)
1. **Add authorization checks** - Verify user has permission to update/redirect documents
2. **Add parish access checks** - Verify user can access the document's parish

### Soon (High Priority)
3. **Add XSS sanitization** - Sanitize documentSubject before inserting into notification
4. **Sanitize logs** - Remove sensitive information from production logs

### Later (Medium Priority)
5. **Implement rate limiting** - Prevent notification spam
6. **Validate UUID format** - Add UUID validation for document ID
7. **Validate target users** - Check for active users, duplicates, etc.

### Nice to Have (Low Priority)
8. **Add CSRF tokens** - Explicit CSRF protection
9. **Genericize error messages** - Prevent information disclosure

---

## Recommendations Summary

1. **🔴 CRITICAL:** Add authorization and permission checks
2. **🟡 HIGH:** Add XSS sanitization for notification messages
3. **🟡 HIGH:** Sanitize logs in production
4. **🟠 MEDIUM:** Implement rate limiting
5. **🟠 MEDIUM:** Add UUID validation for document ID parameter
6. **🟠 MEDIUM:** Validate target users (active status, duplicates)
7. **🟢 LOW:** Add explicit CSRF token validation
8. **🟢 LOW:** Genericize error messages further

---

## Testing Recommendations

### Security Testing
1. **Authorization Tests:**
   - Try to redirect document without proper permissions → Should fail with 403
   - Try to redirect document from different parish → Should fail with 403
   - Try to redirect document as non-creator without special permission → Should fail

2. **XSS Tests:**
   - Create document with subject: `<script>alert('XSS')</script>`
   - Redirect document
   - Verify notification message doesn't execute script

3. **Rate Limiting Tests:**
   - Redirect 100+ documents rapidly
   - Verify rate limit kicks in

4. **Input Validation Tests:**
   - Invalid UUID format for document ID → Should fail with 400
   - Invalid UUID in distributedUserIds → Should be filtered out

5. **Batch Size Tests:**
   - Redirect to 150 users → Should truncate to 100

---

## Conclusion

The implementation has **good security foundations** (SQL injection protection, authentication, input validation), but **lacks critical authorization checks**. The most critical issue is that any authenticated user can redirect any document without verifying permissions or access rights.

**Overall Assessment:** 🟡 **MEDIUM RISK** - Functional but needs authorization hardening

**Recommendation:** Implement authorization checks before deploying to production.






