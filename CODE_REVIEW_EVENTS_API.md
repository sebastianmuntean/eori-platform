# Code Review: Events API (`/src/app/api/events`)

## Overview

This review covers the Events API implementation, which provides comprehensive CRUD operations for church events (weddings, baptisms, funerals), including participant management, document handling, email processing, calendar views, and statistics. The API consists of 13 route files with various endpoints.

## Review Checklist

### Functionality

- [x] Intended behavior works and matches requirements
- [~] Edge cases handled gracefully (see issues below)
- [~] Error handling is appropriate and informative (see improvements needed)

### Code Quality

- [x] Code structure is clear and maintainable
- [~] No unnecessary duplication or dead code (see improvements)
- [ ] Tests/documentation updated as needed (missing)

### Security & Safety

- [~] No obvious security vulnerabilities introduced (see security issues)
- [~] Inputs validated and outputs sanitized (see improvements)
- [~] Sensitive data handled correctly (see improvements)

---

## Critical Issues

### 1. **SECURITY: Missing Authentication on GET Endpoints** 🔴

**Location**: Multiple GET endpoints

**Issue**: Several GET endpoints don't require authentication, potentially exposing sensitive event data:
- `GET /api/events` - Lists all events with filtering
- `GET /api/events/[eventId]` - Gets event details
- `GET /api/events/[eventId]/documents` - Lists event documents
- `GET /api/events/[eventId]/documents/[id]/download` - Downloads documents
- `GET /api/events/[eventId]/participants` - Lists participants
- `GET /api/events/calendar` - Calendar view
- `GET /api/events/statistics` - Statistics

**Impact**: Unauthenticated users can access sensitive information including:
- Event details (dates, locations, participants)
- Personal data (names, emails, phone numbers, CNP)
- Documents (potentially containing sensitive information)

**Recommendation**: Add authentication checks to all GET endpoints, or implement role-based access control to restrict access appropriately.

**Example Fix**:
```typescript
export async function GET(request: Request) {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
  // ... rest of code
}
```

### 2. **SECURITY: Missing Authorization Checks** 🔴

**Location**: All endpoints

**Issue**: While authentication is checked on write operations, there are no authorization checks to verify:
- User has permission to view/modify events for specific parishes
- User has appropriate role (e.g., priest, admin) to perform operations
- User can only access events they're authorized to see

**Impact**: Authenticated users may access/modify events outside their scope of authority.

**Recommendation**: Implement role-based access control (RBAC) checks using the existing `checkPermission` or `requireRole` functions from `@/lib/auth`.

**Example**:
```typescript
import { requirePermission } from '@/lib/auth';

export async function POST(request: Request) {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  // Check if user has permission to create events
  const hasPermission = await checkPermission('events:create');
  if (!hasPermission) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  // ... rest of code
}
```

### 3. **SECURITY: File Upload Vulnerabilities** 🟡

**Location**: `src/app/api/events/[eventId]/documents/route.ts`

**Issues**:
1. **No MIME type validation**: Only file size is checked, but MIME types are not validated. Malicious files could be uploaded.
2. **Path traversal risk**: While UUIDs are used, the file extension extraction could be vulnerable if filenames contain path separators.
3. **No virus scanning**: Uploaded files are not scanned for malware.
4. **Storage path exposure**: Full storage paths are stored in the database, which could be a security concern.

**Current Code**:
```112:136:src/app/api/events/[eventId]/documents/route.ts
    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.log(`❌ File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description) {
      const validation = createDocumentSchema.safeParse({ description });
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0].message },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const storagePath = join(UPLOAD_DIR, eventId, uniqueFileName);
```

**Recommendation**:
```typescript
// Add MIME type whitelist
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // ... other allowed types
];

// Validate MIME type
if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  return NextResponse.json(
    { success: false, error: 'File type not allowed' },
    { status: 400 }
  );
}

// Sanitize file extension
const fileExtension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
if (!fileExtension) {
  return NextResponse.json(
    { success: false, error: 'Invalid file extension' },
    { status: 400 }
  );
}
```

### 4. **SECURITY: SQL Injection Risk in LIKE Queries** 🟡

**Location**: `src/app/api/events/route.ts`, `src/app/api/events/email-submissions/route.ts`

**Issue**: The `like` function is used with user-provided search strings. While Drizzle ORM should handle this safely, the pattern `%${search}%` could potentially be exploited if the ORM doesn't properly escape special characters.

**Current Code**:
```43:50:src/app/api/events/route.ts
    if (search) {
      conditions.push(
        or(
          like(churchEvents.location || '', `%${search}%`),
          like(churchEvents.priestName || '', `%${search}%`),
          like(churchEvents.notes || '', `%${search}%`)
        )!
      );
    }
```

**Recommendation**: Verify that Drizzle ORM properly escapes LIKE patterns. Consider sanitizing the search string or using parameterized queries explicitly.

### 5. **SECURITY: Missing Input Sanitization for Email Content** 🟡

**Location**: `src/app/api/events/email-submissions/[id]/process/route.ts`

**Issue**: Email content is parsed and used directly without sanitization. Malicious email content could potentially cause issues.

**Recommendation**: Sanitize HTML content before parsing, especially if it's displayed anywhere in the UI.

---

## High Priority Issues

### 6. **Missing Authorization on DELETE Operations** 🔴

**Location**: `src/app/api/events/[eventId]/route.ts`

**Issue**: The DELETE endpoint doesn't require authentication, allowing anyone to delete events.

**Current Code**:
```247:280:src/app/api/events/[eventId]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: DELETE /api/events/${eventId} - Deleting event`);

  try {
    const [deletedEvent] = await db
      .delete(churchEvents)
      .where(eq(churchEvents.id, eventId))
      .returning();
```

**Fix Required**: Add authentication check:
```typescript
export async function DELETE(...) {
  const { eventId } = await params;
  
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
  // ... rest of code
}
```

### 7. **Inconsistent Error Handling for Email Sending** 🟡

**Location**: Multiple files (confirm, cancel, update routes)

**Issue**: Email sending failures are caught and logged but don't fail the operation. This is actually good for resilience, but the pattern is inconsistent - some places continue silently, others might need better error reporting.

**Current Code**:
```187:206:src/app/api/events/[eventId]/route.ts
        for (const participant of participants) {
          if (participant.email) {
            try {
              await sendEventConfirmationEmail(
                participant.email,
                `${participant.firstName} ${participant.lastName || ''}`.trim(),
                {
                  type: updatedEvent.type,
                  date: updatedEvent.eventDate,
                  location: updatedEvent.location,
                  priestName: updatedEvent.priestName,
                  parishName: parish?.name || 'Parohie necunoscută',
                  notes: updatedEvent.notes,
                }
              );
            } catch (error) {
              console.error(`Failed to send confirmation email to ${participant.email}:`, error);
            }
          }
        }
```

**Recommendation**: Consider returning a warning in the response if emails fail, or implement a retry mechanism. Also, consider using a background job queue for email sending to avoid blocking the API response.

### 8. **Potential Race Condition in Status Updates** 🟡

**Location**: `src/app/api/events/[eventId]/route.ts`, `confirm/route.ts`, `cancel/route.ts`

**Issue**: Multiple endpoints can update event status concurrently. There's no optimistic locking or transaction handling to prevent race conditions.

**Recommendation**: Use database transactions and consider adding a version field or using optimistic locking to prevent concurrent modifications.

### 9. **Missing Validation for Date Ranges** 🟡

**Location**: `src/app/api/events/route.ts`, `src/app/api/events/calendar/route.ts`

**Issue**: Date range queries (`dateFrom`, `dateTo`) are not validated. Invalid dates or reversed ranges could cause issues.

**Current Code**:
```65:71:src/app/api/events/route.ts
    if (dateFrom) {
      conditions.push(gte(churchEvents.eventDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(churchEvents.eventDate, dateTo));
    }
```

**Recommendation**: Validate date format and ensure `dateFrom <= dateTo`:
```typescript
if (dateFrom && dateTo && dateFrom > dateTo) {
  return NextResponse.json(
    { success: false, error: 'Invalid date range: start date must be before end date' },
    { status: 400 }
  );
}
```

### 10. **Inconsistent Participant Role Validation** 🟡

**Location**: `src/app/api/events/[eventId]/participants/route.ts`

**Issue**: The `createParticipantSchema` allows role `'other'`, but `updateParticipantSchema` also includes `'family_member'` which is not in the create schema. This inconsistency could cause issues.

**Current Code**:
```9:21:src/app/api/events/[eventId]/participants/route.ts
const createParticipantSchema = z.object({
  parishionerId: z.string().uuid().optional().nullable(),
  role: z.enum(['bride', 'groom', 'baptized', 'deceased', 'godparent', 'witness', 'parent', 'other']),
  // ...
});

// vs

const updateParticipantSchema = z.object({
  // ...
  role: z.enum(['bride', 'groom', 'baptized', 'deceased', 'godparent', 'witness', 'parent', 'family_member', 'other']).optional(),
  // ...
});
```

**Recommendation**: Align the role enums between create and update schemas, or document why they differ.

---

## Code Quality Issues

### 11. **Code Duplication: Event Existence Checks** 🟠

**Location**: Multiple files

**Issue**: The pattern of checking if an event exists is repeated in many files:
```typescript
const [event] = await db
  .select()
  .from(churchEvents)
  .where(eq(churchEvents.id, eventId))
  .limit(1);

if (!event) {
  return NextResponse.json(
    { success: false, error: 'Event not found' },
    { status: 404 }
  );
}
```

**Recommendation**: Extract to a utility function:
```typescript
// src/lib/services/events-service.ts
export async function getEventById(eventId: string) {
  const [event] = await db
    .select()
    .from(churchEvents)
    .where(eq(churchEvents.id, eventId))
    .limit(1);
  
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  
  return event;
}
```

### 12. **Code Duplication: Email Sending Logic** 🟠

**Location**: `[eventId]/route.ts`, `confirm/route.ts`, `cancel/route.ts`

**Issue**: Similar email sending logic is duplicated across multiple files.

**Recommendation**: Extract to a shared service function:
```typescript
// src/lib/services/event-notifications.ts
export async function sendEventStatusChangeNotifications(
  eventId: string,
  oldStatus: string,
  newStatus: string,
  cancellationReason?: string
) {
  // ... shared logic
}
```

### 13. **Inconsistent Query Building Pattern** 🟠

**Location**: Multiple files

**Issue**: The pattern for building `whereClause` is inconsistent:
- Sometimes uses `conditions.length === 1 ? conditions[0] : and(...conditions)`
- Sometimes uses `and(...conditions as any[])` with type assertion

**Current Code**:
```73:75:src/app/api/events/route.ts
    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;
```

**Recommendation**: Create a utility function for consistent query building:
```typescript
function buildWhereClause(conditions: any[]) {
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}
```

### 14. **Excessive Console Logging** 🟠

**Location**: All files

**Issue**: Extensive use of `console.log` for debugging. This should be replaced with a proper logging system.

**Recommendation**: Use a structured logging library (e.g., Winston, Pino) or at least create a logging utility that can be configured per environment.

### 15. **Missing Input Validation for Pagination** 🟠

**Location**: `src/app/api/events/route.ts`, `src/app/api/events/email-submissions/route.ts`

**Issue**: Pagination parameters (`page`, `pageSize`) are parsed but not validated. Negative values or extremely large values could cause issues.

**Current Code**:
```27:28:src/app/api/events/route.ts
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
```

**Recommendation**: Add validation:
```typescript
const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
```

### 16. **Type Safety Issues with `as any[]`** 🟠

**Location**: Multiple files

**Issue**: Type assertions `as any[]` are used to bypass TypeScript type checking, which defeats the purpose of using TypeScript.

**Recommendation**: Fix the type definitions properly instead of using type assertions.

### 17. **Missing Transaction Handling** 🟠

**Location**: `src/app/api/events/email-submissions/[id]/process/route.ts`

**Issue**: When creating an event and participants, if participant creation fails, the event is still created, leaving inconsistent data.

**Current Code**:
```94:124:src/app/api/events/email-submissions/[id]/process/route.ts
    // Create event
    console.log('Step 3: Creating event from email submission');
    const [newEvent] = await db
      .insert(churchEvents)
      .values({
        // ...
      })
      .returning();

    // Create participants if any
    if (parsedEvent.participants && parsedEvent.participants.length > 0) {
      console.log(`Step 4: Creating ${parsedEvent.participants.length} participants`);
      // ...
      await db.insert(churchEventParticipants).values(participantsData);
    }
```

**Recommendation**: Use database transactions:
```typescript
await db.transaction(async (tx) => {
  const [newEvent] = await tx.insert(churchEvents).values({...}).returning();
  if (parsedEvent.participants?.length) {
    await tx.insert(churchEventParticipants).values(participantsData);
  }
  await tx.update(churchEventEmailSubmissions).set({...});
});
```

---

## Performance Issues

### 18. **N+1 Query Problem in Email Sending** 🟡

**Location**: `[eventId]/route.ts`, `confirm/route.ts`, `cancel/route.ts`

**Issue**: When sending emails to participants, the code fetches parish information separately for each status change, even though it's the same event.

**Recommendation**: The current implementation is actually fine (fetches once per operation), but consider caching parish information if the same parish is accessed frequently.

### 19. **Inefficient Statistics Query** 🟡

**Location**: `src/app/api/events/statistics/route.ts`

**Issue**: The monthly statistics query runs 12 separate queries in a loop, which is inefficient.

**Current Code**:
```94:119:src/app/api/events/statistics/route.ts
    const byMonth: Array<{ month: string; count: number }> = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthConditions = [
        sql`EXTRACT(YEAR FROM ${churchEvents.eventDate}) = ${year}`,
        sql`EXTRACT(MONTH FROM ${churchEvents.eventDate}) = ${month}`,
      ];
      if (whereClause) {
        monthConditions.push(whereClause);
      }
      
      let monthQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(churchEvents)
        .where(monthConditions.length === 1 ? monthConditions[0] : and(...monthConditions as any[]));
      const monthResult = await monthQuery;
      byMonth.push({
        month: monthStr,
        count: Number(monthResult[0]?.count || 0),
      });
    }
```

**Recommendation**: Use a single query with GROUP BY:
```typescript
const monthQuery = db
  .select({
    month: sql<string>`TO_CHAR(${churchEvents.eventDate}, 'YYYY-MM')`,
    count: sql<number>`count(*)`,
  })
  .from(churchEvents)
  .where(whereClause)
  .groupBy(sql`TO_CHAR(${churchEvents.eventDate}, 'YYYY-MM')`)
  .having(sql`TO_CHAR(${churchEvents.eventDate}, 'YYYY-MM') >= ${twelveMonthsAgo}`);
```

### 20. **Missing Database Indexes** 🟡

**Issue**: Based on the queries, the following indexes would improve performance:
- `church_events(parish_id, event_date)` - for filtering by parish and date
- `church_events(event_date, status)` - for calendar and statistics queries
- `church_event_participants(event_id)` - for fetching participants
- `church_event_documents(event_id)` - for fetching documents

**Recommendation**: Add these indexes via a migration.

---

## Best Practices & Maintainability

### 21. **Inconsistent Schema Validation** 🟠

**Issue**: Some endpoints use Zod schemas, but validation error messages only return the first error. Consider returning all validation errors.

**Recommendation**: Return all validation errors:
```typescript
if (!validation.success) {
  return NextResponse.json(
    { 
      success: false, 
      errors: validation.error.errors,
      error: validation.error.errors[0].message 
    },
    { status: 400 }
  );
}
```

### 22. **Missing API Documentation** 🟠

**Issue**: No OpenAPI/Swagger documentation or comprehensive JSDoc comments describing request/response formats.

**Recommendation**: Add OpenAPI documentation or at least comprehensive JSDoc comments.

### 23. **Hardcoded Configuration Values** 🟠

**Location**: `src/app/api/events/[eventId]/documents/route.ts`

**Issue**: File size limit (10MB) and upload directory are hardcoded.

**Current Code**:
```12:14:src/app/api/events/[eventId]/documents/route.ts
// For now, we'll store files in a local uploads directory
// In production, you'd want to use cloud storage (S3, etc.)
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'events');
```

**Recommendation**: Move to environment variables or configuration file:
```typescript
const MAX_FILE_SIZE = parseInt(process.env.MAX_EVENT_DOCUMENT_SIZE || '10485760'); // 10MB default
const UPLOAD_DIR = process.env.EVENT_DOCUMENTS_UPLOAD_DIR || join(process.cwd(), 'uploads', 'events');
```

### 24. **Missing Rate Limiting** 🟠

**Issue**: No rate limiting on any endpoints. This could lead to abuse, especially on:
- Email fetcher trigger endpoint
- Document upload endpoint
- Statistics endpoint (could be expensive)

**Recommendation**: Implement rate limiting using middleware or a library like `@upstash/ratelimit`.

### 25. **Inconsistent Response Formats** 🟠

**Issue**: Some endpoints return different response structures. For example:
- Some return `{ success: true, data: ... }`
- Some return `{ success: true, data: ..., message: ... }`
- Error responses are consistent, which is good

**Recommendation**: Standardize response formats across all endpoints.

---

## Positive Aspects

1. **Good Error Handling Structure**: Consistent use of `formatErrorResponse` and `logError`
2. **Input Validation**: Zod schemas are used for validation
3. **Database Relationships**: Proper use of foreign keys and cascading deletes
4. **Email Notifications**: Good implementation of email notifications on status changes
5. **Pagination**: Proper pagination implementation in list endpoints
6. **Filtering and Sorting**: Comprehensive filtering and sorting capabilities
7. **Async/Await**: Proper use of async/await throughout
8. **Type Safety**: Good use of TypeScript and Zod for type safety

---

## Recommendations Summary

### Immediate Actions (Critical)
1. Add authentication to all GET endpoints
2. Add authentication to DELETE endpoint
3. Implement authorization checks (RBAC)
4. Add MIME type validation for file uploads
5. Fix participant role enum inconsistency

### High Priority
6. Add transaction handling for multi-step operations
7. Validate pagination parameters
8. Add date range validation
9. Implement proper logging system
10. Add database indexes for performance

### Medium Priority
11. Extract duplicate code to utility functions
12. Optimize statistics queries
13. Add rate limiting
14. Move hardcoded values to configuration
15. Add API documentation

### Low Priority
16. Standardize response formats
17. Add comprehensive test coverage
18. Consider implementing caching for frequently accessed data

---

## Testing Recommendations

1. **Unit Tests**: Test validation schemas, utility functions
2. **Integration Tests**: Test API endpoints with various inputs
3. **Security Tests**: Test authentication/authorization, file upload security
4. **Performance Tests**: Test with large datasets, concurrent requests
5. **Edge Case Tests**: Test with invalid dates, missing data, concurrent updates

---

## Conclusion

The Events API is well-structured and follows many best practices, but has several critical security issues that must be addressed before production deployment. The main concerns are:

1. **Missing authentication on read operations** - This is a critical security vulnerability
2. **Missing authorization checks** - Users may access data outside their scope
3. **File upload security** - Needs MIME type validation and better sanitization

Once these security issues are addressed and the high-priority improvements are implemented, the API will be production-ready. The codebase shows good understanding of RESTful API design and database relationships.

**Overall Assessment**: ⚠️ **Needs Security Improvements Before Production**



