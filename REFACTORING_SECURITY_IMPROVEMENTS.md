# Security Refactoring: Document Redirect Notifications

## Overview

This document summarizes the security improvements implemented based on the security audit recommendations. The refactored code addresses critical, high, and medium priority security vulnerabilities.

---

## ✅ Security Fixes Implemented

### 1. **Authorization Checks** 🔴 CRITICAL - FIXED

**Before:**
- Only checked authentication
- Any authenticated user could redirect any document
- No permission verification
- No parish access control

**After:**
```typescript
// 1. Permission check for updating documents
const hasUpdatePermission = await checkPermission('registratura:update');
if (!hasUpdatePermission) {
  return NextResponse.json(
    { success: false, error: 'You do not have permission to update documents' },
    { status: 403 }
  );
}

// 2. Parish access check
if (document.parishId) {
  await requireParishAccess(document.parishId, false);
}

// 3. Redirect permission check
if (data.solutionStatus === 'redirected') {
  const isCreator = document.createdBy === userId;
  const canRedirectAny = await checkPermission('registratura:redirect_any');
  
  if (!isCreator && !canRedirectAny) {
    return NextResponse.json(
      { success: false, error: 'Only document creator can redirect documents' },
      { status: 403 }
    );
  }
}
```

**Benefits:**
- ✅ Users must have `registratura:update` permission to update documents
- ✅ Users can only access documents from their parish
- ✅ Only creators or users with `registratura:redirect_any` can redirect

---

### 2. **XSS Sanitization** 🟡 HIGH PRIORITY - FIXED

**Before:**
- Document subject inserted directly into notification message
- No HTML escaping

**After:**
```typescript
/**
 * Sanitizes text for safe display in notifications to prevent XSS attacks
 */
function sanitizeForNotification(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// In createDocumentRedirectNotification:
const truncatedSubject = truncateText(documentSubject, MAX_SUBJECT_LENGTH_IN_MESSAGE);
const sanitizedSubject = sanitizeForNotification(truncatedSubject);
message: NOTIFICATION_MESSAGES.documentRedirected(sanitizedSubject),
```

**Benefits:**
- ✅ HTML special characters escaped
- ✅ Prevents XSS even if frontend has vulnerabilities
- ✅ Defense-in-depth security approach

---

### 3. **UUID Validation** 🟠 MEDIUM PRIORITY - FIXED

**Before:**
- Document ID used directly from URL params
- No format validation
- Unnecessary database queries for invalid IDs

**After:**
```typescript
// Validate UUID format early
if (!isValidUUID(id)) {
  return NextResponse.json(
    { success: false, error: 'Invalid document ID format' },
    { status: 400 }
  );
}
```

**Benefits:**
- ✅ Early rejection of invalid UUIDs
- ✅ Better error messages
- ✅ Prevents unnecessary database queries
- ✅ Improved performance

---

### 4. **Enhanced User Validation** 🟠 MEDIUM PRIORITY - FIXED

**Before:**
- Only checked if users exist
- Didn't check if users are active
- Could send notifications to inactive users

**After:**
```typescript
async function validateUserIds(userIds: string[]): Promise<string[]> {
  // Get users including their active status
  const validUsers = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(
      and(
        inArray(users.id, userIds),
        eq(users.isActive, true) // Only include active users
      )
    );
  
  return validUsers.map(user => user.id);
}
```

**Benefits:**
- ✅ Only active users receive notifications
- ✅ Prevents notification spam to inactive accounts
- ✅ Better data quality

---

### 5. **Improved Error Messages** 🟢 LOW PRIORITY - FIXED

**Before:**
- Error messages could reveal information
- "Document not found" vs "Access denied" helped enumeration

**After:**
```typescript
// Generic error messages
if (!document) {
  return NextResponse.json(
    { success: false, error: 'Document not found or access denied' },
    { status: 404 }
  );
}
```

**Benefits:**
- ✅ Prevents information disclosure
- ✅ Makes enumeration attacks harder
- ✅ Consistent error handling

---

### 6. **Sanitized Logging** 🟡 HIGH PRIORITY - FIXED

**Before:**
- Logs included document IDs, user IDs
- Could expose sensitive information

**After:**
```typescript
// Development: Full details
if (process.env.NODE_ENV === 'development') {
  console.log(`✓ Document ${id} found`);
} else {
  // Production: Sanitized
  console.log(`✓ Document found`);
}
```

**Benefits:**
- ✅ No sensitive data in production logs
- ✅ Better privacy protection
- ✅ Reduced risk of information leakage

---

### 7. **Enhanced Input Validation** ✅ IMPROVED

**Before:**
- Basic Zod validation
- Generic error messages

**After:**
```typescript
// Enhanced error handling
const validation = updateDocumentSchema.safeParse(body);
if (!validation.success) {
  const errorDetails = formatValidationErrors(validation.error.errors);
  return NextResponse.json(
    {
      success: false,
      error: errorDetails.message,
      errors: errorDetails.errors,
      fields: errorDetails.fields,
    },
    { status: 400 }
  );
}
```

**Benefits:**
- ✅ Better error messages with field-level details
- ✅ Easier debugging for clients
- ✅ Consistent error format

---

### 8. **GET Endpoint Security** ✅ IMPROVED

**Added to GET endpoint:**
- UUID validation
- Parish access checks
- Generic error messages
- Sanitized logging

**Benefits:**
- ✅ Consistent security across all endpoints
- ✅ Prevents unauthorized document access
- ✅ Better error handling

---

## Security Checklist Status

### Before Refactoring
- [x] Dependencies secure
- [x] No hardcoded secrets
- [x] Input validation (basic)
- [x] Authentication secure
- [ ] **Authorization properly configured** ❌
- [x] SQL injection protected
- [ ] **XSS protection** ⚠️ (frontend only)
- [ ] Rate limiting (partial - batch limit only)
- [ ] Error messages (leak information)
- [ ] CSRF protection (Next.js default only)

### After Refactoring
- [x] Dependencies secure
- [x] No hardcoded secrets
- [x] Input validation (enhanced)
- [x] Authentication secure
- [x] **Authorization properly configured** ✅
- [x] SQL injection protected
- [x] **XSS protection** ✅ (backend + frontend)
- [ ] Rate limiting (still partial - batch limit only)
- [x] Error messages (generic, secure)
- [ ] CSRF protection (Next.js default - acceptable)

---

## Code Quality Improvements

### 1. **Better Error Handling**
- Structured error responses with field-level details
- Generic error messages to prevent information disclosure
- Proper HTTP status codes

### 2. **Improved Function Documentation**
- Added security notes to function JSDoc
- Clear parameter descriptions
- Security considerations documented

### 3. **Code Organization**
- Security checks grouped together
- Early returns for invalid inputs
- Clear flow: validate → authenticate → authorize → process

### 4. **Type Safety**
- Proper TypeScript types
- Type-safe permission checks
- Type-safe database queries

---

## Performance Improvements

### 1. **Early Validation**
- UUID validation happens before database queries
- Invalid requests rejected quickly
- Reduced database load

### 2. **Optimized User Validation**
- Single query with AND condition for active users
- Filters invalid users in database query
- No need for post-processing

---

## Testing Recommendations

### Security Testing
1. **Authorization Tests:**
   - Try to redirect without `registratura:update` permission → Should fail 403
   - Try to redirect document from different parish → Should fail 403
   - Try to redirect as non-creator without `redirect_any` → Should fail 403
   - Try to redirect as creator → Should succeed

2. **XSS Tests:**
   - Create document with subject: `<script>alert('XSS')</script>`
   - Redirect document
   - Verify notification message escapes HTML properly

3. **UUID Validation Tests:**
   - Invalid UUID format → Should fail 400 immediately
   - Valid UUID → Should proceed

4. **User Validation Tests:**
   - Redirect to inactive user → Should be filtered out
   - Redirect to non-existent user → Should be filtered out
   - Redirect to active users → Should succeed

---

## Remaining Recommendations

### Medium Priority
1. **Rate Limiting** - Consider adding per-user rate limiting for redirect operations
2. **CSRF Tokens** - Consider explicit CSRF token validation (currently using Next.js defaults)

### Low Priority
1. **Notification Deduplication** - Prevent duplicate notifications for same document/user
2. **Audit Logging** - Log redirect actions for audit trail

---

## Summary

**Security Status:** ✅ **SIGNIFICANTLY IMPROVED**

### Critical Issues Fixed: 1/1 ✅
- Authorization checks implemented

### High Priority Issues Fixed: 2/2 ✅
- XSS sanitization added
- Log sanitization implemented

### Medium Priority Issues Fixed: 3/3 ✅
- UUID validation added
- Enhanced user validation (active status)
- Better error messages

### Code Quality: ✅ Improved
- Better documentation
- Enhanced error handling
- Improved performance

**Overall Assessment:** The code is now **production-ready** from a security perspective. The remaining recommendations (rate limiting, CSRF tokens) are nice-to-have improvements but not critical blockers.


