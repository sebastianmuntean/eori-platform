# Code Review: Notifications API Routes

## Overview

Review of the notifications API implementation located in `src/app/api/notifications/` and its subdirectories. This review covers functionality, security, code quality, and architectural concerns.

**Files Reviewed:**
- `src/app/api/notifications/route.ts` (GET, POST)
- `src/app/api/notifications/unread-count/route.ts` (GET)
- `src/app/api/notifications/[id]/read/route.ts` (PATCH)
- `src/app/api/notifications/read-all/route.ts` (PATCH)

---

## ✅ Functionality

### Working Features

- ✅ GET `/api/notifications` - List notifications with pagination, filtering, and sorting
- ✅ POST `/api/notifications` - Create notifications for multiple users
- ✅ GET `/api/notifications/unread-count` - Get unread count for current user
- ✅ PATCH `/api/notifications/[id]/read` - Mark single notification as read
- ✅ PATCH `/api/notifications/read-all` - Mark all notifications as read
- ✅ Authentication required for all routes
- ✅ Proper error handling with consistent response format
- ✅ Input validation using Zod schemas
- ✅ Database queries use parameterized queries (drizzle-orm)

---

## 🟡 Issues and Recommendations

### 1. **JSON Parsing Error Handling** (Medium Priority)

**Location:** `src/app/api/notifications/route.ts:130`

**Issue:** The POST route doesn't explicitly handle JSON parsing errors. While the error is caught by the outer try-catch, it returns a generic error response instead of a specific "Invalid JSON" message.

**Current Code:**
```130:131:src/app/api/notifications/route.ts
    const body = await request.json();
    const validation = createNotificationSchema.safeParse(body);
```

**Recommendation:** Follow the pattern used in `src/app/api/clients/route.ts`:

```typescript
// Parse and validate request body
let body: unknown;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    { success: false, error: 'Invalid JSON in request body' },
    { status: 400 }
  );
}

const validation = createNotificationSchema.safeParse(body);
```

**Impact:** Improves error messages for malformed JSON requests.

---

### 2. **Missing Authorization Check** (Medium Priority)

**Location:** `src/app/api/notifications/route.ts:118` (POST handler)

**Issue:** The POST route allows any authenticated user to create notifications for any other user(s). There's no permission check to restrict who can send notifications.

**Current Code:**
```118:128:src/app/api/notifications/route.ts
export async function POST(request: Request) {
  console.log('Step 1: POST /api/notifications - Creating notifications');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
```

**Recommendation:** Add permission check (as noted in the plan: "POST route may require admin permissions (to be determined)"):

```typescript
import { checkPermission } from '@/lib/auth';

// After authentication check
const hasPermission = await checkPermission('notifications:create');
if (!hasPermission) {
  return NextResponse.json(
    { success: false, error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

**Impact:** Security concern - prevents unauthorized users from spamming notifications to other users.

**Note:** The plan mentions this is "to be determined", so this may be intentional. Should be clarified with the team.

---

### 3. **UUID Validation in Route Parameters** (Low Priority)

**Location:** `src/app/api/notifications/[id]/read/route.ts:15`

**Issue:** The PATCH route doesn't validate that the `id` parameter is a valid UUID format before querying the database.

**Current Code:**
```15:16:src/app/api/notifications/[id]/read/route.ts
  const { id } = await params;
  console.log(`Step 1: PATCH /api/notifications/${id}/read - Marking as read`);
```

**Recommendation:** Add UUID validation (follows pattern from `src/app/api/pilgrimages/[id]/participants/route.ts`):

```typescript
import { isValidUUID } from '@/lib/validation'; // or similar utility

const { id } = await params;

// Validate UUID format
if (!isValidUUID(id)) {
  return NextResponse.json(
    { success: false, error: 'Invalid notification ID format' },
    { status: 400 }
  );
}
```

**Impact:** Provides better error messages for invalid UUIDs and prevents unnecessary database queries.

---

### 4. **Batch Insert Performance Consideration** (Low Priority)

**Location:** `src/app/api/notifications/route.ts:175`

**Issue:** The POST route can theoretically accept an unlimited number of user IDs, which could lead to performance issues or database connection timeouts with very large batches.

**Current Code:**
```175:178:src/app/api/notifications/route.ts
    const createdNotifications = await db
      .insert(notifications)
      .values(notificationsToCreate)
      .returning();
```

**Recommendation:** Consider adding a maximum batch size limit:

```typescript
const MAX_BATCH_SIZE = 100; // or appropriate limit

if (data.userIds.length > MAX_BATCH_SIZE) {
  return NextResponse.json(
    { success: false, error: `Maximum ${MAX_BATCH_SIZE} users allowed per batch` },
    { status: 400 }
  );
}
```

**Impact:** Prevents potential performance issues with very large batches. However, for notifications, this is less critical than other use cases.

**Note:** The current implementation uses drizzle-orm's batch insert which is efficient. This is more of a defensive measure.

---

### 5. **Code Duplication: validatePagination** (Low Priority)

**Location:** `src/app/api/notifications/route.ts:12`

**Issue:** The `validatePagination` function is defined locally but similar functions exist in service files (e.g., `src/lib/services/pilgrimages-service.ts`, `src/lib/services/events-service.ts`).

**Recommendation:** This is acceptable as many routes define this locally. If it becomes a maintenance issue, consider extracting to a shared utility. For now, this follows the existing pattern in the codebase.

---

### 6. **Missing URL Validation** (Low Priority)

**Location:** `src/app/api/notifications/route.ts:30`

**Issue:** The `link` field is validated for length but not for URL format.

**Current Code:**
```29:30:src/app/api/notifications/route.ts
  module: z.string().max(100).optional().nullable(),
  link: z.string().max(500).optional().nullable(),
```

**Recommendation:** Add URL format validation if links should be valid URLs:

```typescript
link: z.string().url('Link must be a valid URL').max(500).optional().nullable(),
```

**Impact:** Low - depends on whether links need to be valid URLs or can be relative paths.

---

## ✅ Security

### Security Strengths

- ✅ All routes require authentication via `getCurrentUser()`
- ✅ Input validation using Zod schemas prevents injection attacks
- ✅ Database queries use parameterized queries (drizzle-orm)
- ✅ User ownership verification in PATCH routes
- ✅ UUID validation in Zod schemas

### Security Considerations

- ⚠️ **Missing authorization check** - POST route allows any authenticated user to send notifications to any user (see Issue #2)
- ✅ **SQL Injection** - Protected by drizzle-orm parameterized queries
- ✅ **XSS** - Not applicable (server-side API)
- ✅ **CSRF** - Handled by Next.js framework

---

## ✅ Code Quality

### Strengths

- ✅ Consistent error handling pattern
- ✅ Proper use of drizzle-orm query builder
- ✅ Clear function names and comments
- ✅ Follows existing codebase patterns
- ✅ Type-safe with TypeScript and Zod validation

### Minor Improvements

- Consider extracting JSON parsing error handling to a utility function (Issue #1)
- UUID validation in route params would improve error messages (Issue #3)

---

## ✅ Edge Cases

### Handled Correctly

- ✅ Empty user array (minimum 1 enforced by Zod)
- ✅ Invalid user IDs (validated and returns error)
- ✅ Non-existent notification (returns 404)
- ✅ Notification ownership verification
- ✅ Already-read notifications (idempotent - fine to mark as read again)

### Potential Edge Cases

- Very large batch sizes (see Issue #4)
- Invalid UUID format in route params (see Issue #3)

---

## ✅ Performance

### Strengths

- ✅ Efficient database queries using drizzle-orm
- ✅ Proper use of indexes (user_id, is_read)
- ✅ Pagination implemented correctly
- ✅ Batch insert is efficient

### Considerations

- Batch size limit would prevent potential issues (Issue #4)
- No N+1 query problems
- Count query is separate from data query (acceptable for pagination)

---

## 📝 Summary

### Critical Issues: **0**

### High Priority Issues: **0**

### Medium Priority Issues: **2**
1. Missing authorization check for POST route (security consideration)
2. JSON parsing error handling could be more specific

### Low Priority Issues: **3**
1. UUID validation in route parameters
2. Batch size limit consideration
3. URL format validation for link field

### Overall Assessment

The implementation is **solid and production-ready** with minor improvements recommended. The code follows existing patterns in the codebase, uses proper authentication, validation, and error handling. The main consideration is whether authorization checks are needed for the POST route (to be determined per requirements).

**Recommendation:** ✅ **Approve with minor improvements**

---

## 🎯 Action Items

1. **Decide on authorization requirements** for POST `/api/notifications` route
2. Add JSON parsing error handling for better error messages
3. (Optional) Add UUID validation in route parameters
4. (Optional) Consider batch size limit if large batches are a concern

---

## Additional Notes

- The code follows the existing patterns in the codebase well
- Error handling is consistent and appropriate
- Database queries are efficient and secure
- The implementation matches the requirements from the plan document
- All routes are properly authenticated
- Input validation is comprehensive

