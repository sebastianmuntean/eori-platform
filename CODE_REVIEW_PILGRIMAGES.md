# Code Review: Pilgrimages Module Implementation

## Overview
This code review examines the complete implementation of the Pilgrimages module, including API routes, hooks, services, database schema, and frontend pages.

---

## ✅ Strengths

1. **Comprehensive Feature Set**: The module includes all major features (participants, schedule, documents, payments, transport, accommodation, meals)
2. **Well-Structured Schema**: Database schema follows existing patterns with proper relationships and enums
3. **Consistent API Patterns**: API routes follow existing codebase patterns
4. **Good Validation**: Zod schemas are used for input validation
5. **Internationalization**: All translations are properly implemented
6. **Type Safety**: TypeScript interfaces are well-defined

---

## 🔴 Critical Issues

### 1. **Missing Export Participants API Route**
**Location**: `src/hooks/usePilgrimageParticipants.ts:231-259`

The `exportParticipants` function in the hook calls an API endpoint that doesn't exist:
```typescript
const response = await fetch(`/api/pilgrimages/${pilgrimageId}/participants/export`);
```

**Impact**: This will cause runtime errors when users try to export participants.

**Recommendation**: 
- Create `src/app/api/pilgrimages/[id]/participants/export/route.ts`
- Or remove the export functionality until it's implemented

---

### 2. **Permission Check Inconsistencies**
**Location**: Multiple API routes

Different permission checks are used inconsistently:
- `pilgrimages:manage_participants` (used in participants route)
- `pilgrimages:update` (used in schedule, payments routes)
- `pilgrimages:edit` (used in documents route)

**Example**:
```typescript
// src/app/api/pilgrimages/[id]/participants/route.ts:94
const hasPermission = await checkPermission('pilgrimages:manage_participants');

// src/app/api/pilgrimages/[id]/schedule/route.ts:98
const hasPermission = await checkPermission('pilgrimages:update');
```

**Impact**: Users might have different access levels than intended.

**Recommendation**: 
- Standardize on permission naming: `pilgrimages:view`, `pilgrimages:create`, `pilgrimages:update`, `pilgrimages:delete`
- Or define granular permissions clearly in documentation

---

### 3. **Missing Parish Access Validation**
**Location**: All API routes

The codebase pattern (seen in `online-forms`, `events`) includes `requireParishAccess()` checks, but pilgrimages routes don't verify users can access the parish.

**Example from events module**:
```typescript
await requireParishAccess(form.parishId, true);
```

**Impact**: Users might access pilgrimages from parishes they shouldn't have access to.

**Recommendation**:
- Add `requireParishAccess()` checks after fetching pilgrimage
- Or add parish filtering in GET routes based on user's accessible parishes

---

### 4. **Missing UUID Validation**
**Location**: All API routes with `[id]` params

UUID format is not validated before database queries.

**Example**:
```typescript
// src/app/api/pilgrimages/[id]/participants/route.ts:37
const { id } = await params;
// No validation - directly used in queries
```

**Impact**: Invalid UUIDs cause database errors instead of clear 400 responses.

**Recommendation**:
- Add UUID validation utility function
- Validate all route params before use:
```typescript
if (!isValidUUID(id)) {
  return NextResponse.json(
    { success: false, error: 'Invalid pilgrimage ID' },
    { status: 400 }
  );
}
```

---

### 5. **Missing Error Handling in JSON Parsing**
**Location**: Multiple POST/PUT routes

`request.json()` is not wrapped in try-catch in some routes.

**Example**:
```typescript
// src/app/api/pilgrimages/route.ts:181
const body = await request.json(); // Can throw if invalid JSON
const validation = createPilgrimageSchema.safeParse(body);
```

**Impact**: Invalid JSON causes unhandled exceptions.

**Recommendation**: Wrap in try-catch (as done in `clients` route):
```typescript
let body: unknown;
try {
  body = await request.json();
} catch (error) {
  return NextResponse.json(
    { success: false, error: 'Invalid JSON in request body' },
    { status: 400 }
  );
}
```

---

## ⚠️ Major Issues

### 6. **Using `alert()` in React Components**
**Location**: `src/app/[locale]/dashboard/pilgrimages/[id]/participants/page.tsx:90`

```typescript
if (!formData.firstName) {
  alert(t('fillRequiredFields')); // ❌ Using alert()
  return;
}
```

**Impact**: Poor UX, blocks UI thread, not accessible.

**Recommendation**: Use toast notifications or inline error messages (check if codebase has toast component).

---

### 7. **Missing Data Refresh After Mutations**
**Location**: Multiple hooks

After mutations (add/update/delete), data is updated locally but sometimes not refreshed from server, causing stale data.

**Example**:
```typescript
// src/hooks/usePilgrimageParticipants.ts:101
setParticipants((prev) => [...prev, result.data]); // Local update only
// Should also call fetchParticipants() to ensure consistency
```

**Recommendation**: 
- Option 1: Always refresh from server after mutations
- Option 2: Optimistically update but validate with server
- Option 3: Return full updated data from API and update state

---

### 8. **Missing Transaction Handling**
**Location**: Related operations (e.g., payments + participant updates)

When operations affect multiple related entities, no database transactions are used.

**Impact**: Partial failures can leave data in inconsistent state.

**Recommendation**: Use database transactions for related operations (if Drizzle supports it, or use raw SQL transactions).

---

### 9. **File Upload Security Concerns**
**Location**: `src/app/api/pilgrimages/[id]/documents/route.ts`

**Issues**:
1. File names not sanitized - could contain path traversal (`../../`)
2. No virus scanning
3. MIME type validation based on client-provided type (can be spoofed)

**Example**:
```typescript
const fileExtension = file.name.split('.').pop(); // Could be manipulated
const uniqueFileName = `${randomUUID()}.${fileExtension}`;
```

**Recommendation**:
- Sanitize file names: remove special characters, path separators
- Validate file extension matches MIME type
- Consider using file type detection library (e.g., `file-type`)
- For production: Add virus scanning

---

### 10. **Missing Validation: End Date After Start Date**
**Location**: `src/app/api/pilgrimages/route.ts:createPilgrimageSchema`

Pilgrimage creation doesn't validate that `endDate >= startDate`.

**Impact**: Can create pilgrimages with invalid date ranges.

**Recommendation**: Add custom Zod validation:
```typescript
.refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, { message: 'End date must be after start date' })
```

---

### 11. **Missing Validation: Max Participants >= Min Participants**
**Location**: `src/app/api/pilgrimages/route.ts:createPilgrimageSchema`

No validation that `maxParticipants >= minParticipants`.

**Recommendation**: Add refinement validation.

---

### 12. **Missing Registration Deadline Validation**
**Location**: `src/app/api/pilgrimages/route.ts`

Should validate that `registrationDeadline <= startDate` (can't register after pilgrimage starts).

---

## 🔵 Moderate Issues

### 13. **Inconsistent Error Response Format**
**Location**: Various API routes

Some routes return full error details, others return only first error message.

**Example**:
```typescript
// Returns only first error
{ success: false, error: validation.error.errors[0].message }

// Should return full details (like clients route)
{ 
  success: false, 
  error: errorDetails.message,
  errors: errorDetails.errors,
  fields: errorDetails.fields,
}
```

---

### 14. **Missing Pagination in Sub-Resource Routes**
**Location**: Participants, schedule, documents routes

GET endpoints return all records without pagination, which could be problematic for large pilgrimages.

**Recommendation**: Add pagination support or at least document the limitation.

---

### 15. **Missing Sorting in Sub-Resource Routes**
**Location**: Participants, schedule routes

No sorting capability in GET endpoints.

**Recommendation**: Add `sortBy` and `sortOrder` query parameters.

---

### 16. **Incomplete Hook Types**
**Location**: `src/hooks/usePilgrimageSchedule.ts`, etc.

Some hooks are missing TypeScript exports or have incomplete type definitions.

**Recommendation**: Ensure all hooks export proper types (ActivityType, ScheduleItem, etc.).

---

### 17. **Duplicate Code in Hooks**
**Location**: Multiple hooks

Error handling, loading state management is duplicated across hooks.

**Recommendation**: Extract common patterns into a base hook or utility.

---

### 18. **Missing Loading States in Forms**
**Location**: Form components

Some forms don't disable inputs/submit buttons during submission.

**Recommendation**: Ensure all forms properly handle loading states.

---

### 19. **No Optimistic Updates**
**Location**: All hooks

No optimistic updates for better UX (immediate UI feedback while API call is in progress).

**Recommendation**: Consider adding optimistic updates for faster perceived performance.

---

### 20. **Missing Search in Some Routes**
**Location**: Schedule, documents routes

No search functionality in GET endpoints.

**Recommendation**: Add search parameter support.

---

## 📝 Minor Issues & Suggestions

### 21. **Code Duplication in Service Functions**
**Location**: `src/lib/services/pilgrimages-service.ts`

`buildWhereClause` exists but `buildPilgrimageWhereClause` is referenced elsewhere - inconsistency.

---

### 22. **Missing JSDoc Comments**
**Location**: Service functions

Some service functions lack proper JSDoc documentation.

**Recommendation**: Add comprehensive JSDoc comments.

---

### 23. **Magic Numbers**
**Location**: Various files

Hardcoded values like `MAX_FILE_SIZE = 10485760` should be constants.

**Recommendation**: Extract to well-named constants with comments.

---

### 24. **Missing Input Debouncing**
**Location**: Search inputs in pages

Search triggers API calls on every keystroke.

**Recommendation**: Add debouncing (e.g., 300ms delay).

---

### 25. **Incomplete Placeholder Pages**
**Location**: Transport, accommodation, meals pages

These pages have basic structure but incomplete functionality.

**Recommendation**: Complete implementation or clearly mark as "coming soon".

---

## 🔒 Security Considerations

1. **SQL Injection**: ✅ Protected by Drizzle ORM
2. **XSS**: ✅ React escapes by default, but review user-generated content display
3. **CSRF**: ✅ Next.js provides CSRF protection
4. **File Upload**: ⚠️ Needs improvement (see issue #9)
5. **Authorization**: ⚠️ Missing parish access checks (see issue #3)
6. **Input Validation**: ✅ Good (Zod schemas)
7. **Rate Limiting**: ⚠️ Not implemented (should add for production)

---

## 📊 Testing Recommendations

1. **Unit Tests**: Add tests for service functions
2. **Integration Tests**: Test API routes with various inputs
3. **E2E Tests**: Test complete user workflows
4. **Edge Cases**: Test with invalid UUIDs, missing data, concurrent updates

---

## 🎯 Priority Action Items

### High Priority (Fix Before Production)
1. ✅ Fix missing export participants API route
2. ✅ Standardize permission checks
3. ✅ Add parish access validation
4. ✅ Add UUID validation
5. ✅ Fix file upload security
6. ✅ Add date range validations

### Medium Priority (Should Fix)
7. ✅ Replace `alert()` with proper error handling
8. ✅ Add error handling for JSON parsing
9. ✅ Improve data refresh after mutations
10. ✅ Add pagination to sub-resource routes

### Low Priority (Nice to Have)
11. ✅ Add debouncing to search
12. ✅ Add optimistic updates
13. ✅ Extract duplicate code
14. ✅ Complete placeholder pages
15. ✅ Add comprehensive JSDoc

---

## ✅ Code Quality Score

**Overall**: 7.5/10

- **Functionality**: 8/10 - Comprehensive but missing some features
- **Security**: 6/10 - Good validation, but missing some checks
- **Maintainability**: 8/10 - Good structure, some duplication
- **Performance**: 7/10 - Works but could be optimized
- **Testing**: 4/10 - No tests found
- **Documentation**: 7/10 - Good comments, could be better

---

## 📋 Summary

The Pilgrimages module is well-implemented overall and follows existing codebase patterns. However, there are several critical issues that should be addressed before production deployment, particularly around security (file uploads, parish access), missing API routes, and permission inconsistencies.

The codebase is maintainable and well-structured, but would benefit from better error handling, validation edge cases, and security hardening.



