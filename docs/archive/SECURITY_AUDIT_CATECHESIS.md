# Security Audit: Catechesis Module

## Overview

Comprehensive security audit of the catechesis module focusing on XSS vulnerabilities, input validation, authentication/authorization, and data handling practices.

**Audit Date:** 2024
**Scope:** Catechesis module components, API routes, and related translation files

---

## Executive Summary

### Security Status: 🟡 Medium Risk

The catechesis module has **good security foundations** with proper authentication, authorization, and iframe sandboxing. However, **critical XSS vulnerabilities exist** due to unsanitized HTML content being rendered in iframes.

### Critical Issues Found: 1
### High Issues Found: 0
### Medium Issues Found: 2
### Low Issues Found: 1

---

## 1. Dependency Audit

### ✅ Status: Secure

**Analysis:**
- Modern dependency versions (Next.js 16, React 19)
- No obvious vulnerable packages identified
- Standard security libraries (bcryptjs for passwords)

**Recommendations:**
- Run `npm audit` regularly
- Consider adding `npm audit` to CI/CD pipeline
- Monitor security advisories for dependencies

**Action Items:**
- [ ] Set up automated dependency scanning in CI/CD
- [ ] Document dependency update policy

---

## 2. Code Security Review

### 🔴 CRITICAL: XSS Vulnerability in HTML Content Rendering

**Location:** 
- `src/components/catechesis/LessonViewer.tsx` (line 112)
- `src/components/catechesis/LessonEditor.tsx` (line 163)
- `src/app/api/catechesis/lessons/[id]/preview/route.ts`

**Issue:**
HTML content from the database is rendered directly into iframes using `srcDoc` without sanitization. While iframe sandbox attributes provide some protection, malicious HTML could still:

1. Execute JavaScript if sandbox restrictions are bypassed
2. Steal data from the parent page via postMessage
3. Perform clickjacking attacks
4. Exfiltrate data through various iframe communication vectors

**Current Code:**
```typescript
// LessonViewer.tsx line 112
<iframe
  srcDoc={content || `<p>${t('lessons.noContentAvailable')}</p>`}
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
  ...
/>
```

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Stored XSS attacks through lesson content
- Data exfiltration
- Session hijacking
- Unauthorized actions on behalf of users

**Recommendation:**
1. **Server-side HTML sanitization** before storing lesson content
2. **Client-side sanitization** as defense-in-depth
3. **More restrictive iframe sandbox** attributes
4. **Content Security Policy (CSP)** headers

**Fix:**
```typescript
// Install DOMPurify: npm install dompurify @types/dompurify
import DOMPurify from 'isomorphic-dompurify';

// In LessonViewer.tsx
const sanitizedContent = content 
  ? DOMPurify.sanitize(content, { 
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'style'],
      ALLOW_DATA_ATTR: false
    })
  : `<p>${t('lessons.noContentAvailable')}</p>`;

<iframe
  srcDoc={sanitizedContent}
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
  ...
/>
```

**Server-side Fix (API Route):**
```typescript
// In lesson validation schema
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHtml = (html: string | null | undefined): string | null => {
  if (!html) return null;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id'],
    ALLOW_DATA_ATTR: false
  });
};
```

### 🟡 MEDIUM: Iframe Sandbox Permissions Too Permissive

**Location:** `src/components/catechesis/LessonViewer.tsx` (line 115)

**Issue:**
The iframe sandbox allows `allow-same-origin`, `allow-scripts`, `allow-forms`, and `allow-popups`. This combination is necessary for interactive content but increases the attack surface.

**Current Code:**
```typescript
sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
```

**Risk Level:** 🟡 **MEDIUM**

**Recommendation:**
- Review if all permissions are necessary
- Consider removing `allow-popups` if not needed
- Document why each permission is required
- Implement CSP headers as additional protection

**Fix:**
```typescript
// More restrictive if possible
sandbox="allow-same-origin allow-scripts allow-forms"
// Remove allow-popups if not needed for lesson content
```

### 🟡 MEDIUM: Missing Translation Key Sanitization

**Location:** `src/components/catechesis/LessonViewer.tsx` (line 112)

**Issue:**
Translation strings are interpolated into HTML without escaping. While translation files are controlled, this pattern could be vulnerable if translation values are compromised.

**Current Code:**
```typescript
srcDoc={content || `<p>${t('lessons.noContentAvailable')}</p>`}
```

**Risk Level:** 🟡 **MEDIUM** (Low actual risk, but poor practice)

**Recommendation:**
- Escape translation strings when used in HTML contexts
- Use DOMPurify for all HTML construction
- Consider using React's JSX for HTML construction instead of template strings

**Fix:**
```typescript
const fallbackContent = DOMPurify.sanitize(`<p>${t('lessons.noContentAvailable')}</p>`);
srcDoc={content ? sanitizedContent : fallbackContent}
```

### 🟢 LOW: Error Message Exposure

**Location:** `src/components/catechesis/LessonViewer.tsx` (line 43, 83)

**Issue:**
Error messages are displayed to users without sanitization. While this is generally safe, error messages from the API could potentially contain sensitive information.

**Current Code:**
```typescript
setError(err instanceof Error ? err.message : t('errors.failedToLoad'));
// ...
{error}
```

**Risk Level:** 🟢 **LOW**

**Recommendation:**
- Ensure API error messages don't leak sensitive information
- Sanitize error messages before display
- Use generic error messages for production

---

## 3. Authentication & Authorization

### ✅ Status: Secure

**Analysis:**
- ✅ All API routes check authentication (`getCurrentUser()`)
- ✅ Parish access validation (`requireParishAccess()`)
- ✅ Input validation using Zod schemas
- ✅ UUID validation for IDs
- ✅ Search input sanitization (`sanitizeSearch()`)

**Verified Patterns:**
```typescript
// Authentication check
const { userId, user } = await getCurrentUser();
if (!userId || !user) {
  return createErrorResponse('Not authenticated', 401);
}

// Authorization check
await requireParishAccess(data.parishId, true);

// Input validation
const validation = createCatechesisLessonSchema.safeParse(body);
if (!validation.success) {
  return createErrorResponse('Validation failed', 400);
}
```

**Strengths:**
- Consistent authentication pattern across all routes
- Proper authorization checks
- Input validation with Zod
- UUID validation prevents injection
- Search sanitization prevents XSS in search queries

**No issues found in authentication/authorization.**

---

## 4. Input Validation

### ✅ Status: Mostly Secure (with concerns)

**Analysis:**

**Good Practices:**
- ✅ Zod schema validation for all inputs
- ✅ UUID validation for IDs
- ✅ Search string sanitization
- ✅ Pagination limits (max 100 items)
- ✅ Boolean parsing with validation
- ✅ Enum validation for sort fields

**Concerns:**
- ⚠️ **HTML content field not sanitized** (see Critical Issue #1)
- ⚠️ No length limits on HTML content field (could enable DoS)
- ⚠️ No validation of HTML structure/validity

**Recommendations:**
1. Add HTML sanitization to lesson validation schema
2. Add maximum length limit for HTML content (e.g., 1MB)
3. Validate HTML structure before storing
4. Consider using a whitelist approach for allowed HTML tags

---

## 5. Data Handling

### ✅ Status: Secure

**Analysis:**
- ✅ No sensitive data in translation files (static JSON only)
- ✅ No hardcoded secrets found
- ✅ Environment variables properly used (via `config/env.ts`)
- ✅ No SQL injection risks (using Drizzle ORM with parameterized queries)
- ✅ Proper error handling without data leakage

**No issues found in data handling.**

---

## 6. Infrastructure Security

### ✅ Status: Secure

**Analysis:**
- ✅ No hardcoded secrets in code
- ✅ Environment variables used for configuration
- ✅ Proper access controls (parish-based)
- ✅ No direct database queries (using ORM)

**Recommendations:**
- [ ] Review environment variable security in deployment
- [ ] Ensure `.env` files are in `.gitignore`
- [ ] Use secrets management in production
- [ ] Review API rate limiting (if not already implemented)

---

## Security Checklist

### Dependencies
- [x] Dependencies reviewed (no obvious vulnerabilities)
- [ ] Automated dependency scanning in CI/CD
- [ ] Dependency update policy documented

### Authentication & Authorization
- [x] All API routes require authentication
- [x] Authorization checks in place
- [x] Parish access validation
- [x] No privilege escalation vulnerabilities

### Input Validation
- [x] Input validation with Zod schemas
- [x] UUID validation for IDs
- [x] Search input sanitization
- [ ] **HTML content sanitization (CRITICAL - MISSING)**
- [ ] HTML content length limits
- [ ] HTML structure validation

### XSS Prevention
- [ ] **HTML content sanitization (CRITICAL - MISSING)**
- [x] Iframe sandbox attributes present
- [ ] More restrictive sandbox permissions
- [ ] Content Security Policy headers
- [ ] Translation string escaping in HTML contexts

### Data Handling
- [x] No hardcoded secrets
- [x] Environment variables used properly
- [x] No SQL injection risks
- [x] Proper error handling

---

## Priority Actions

### 🔴 Critical (Fix Immediately)

1. **Implement HTML sanitization for lesson content**
   - Add DOMPurify or similar library
   - Sanitize on server-side (API routes)
   - Sanitize on client-side (defense-in-depth)
   - Define allowed HTML tags/attributes
   - Add HTML content length limits

### 🟡 High (Fix Soon)

2. **Review and restrict iframe sandbox permissions**
   - Remove unnecessary permissions
   - Document required permissions
   - Add CSP headers

3. **Add HTML content validation to schema**
   - Maximum length validation
   - HTML structure validation
   - Sanitization in validation layer

### 🟢 Low (Improvements)

4. **Error message sanitization**
   - Sanitize error messages before display
   - Use generic messages in production

5. **Translation string escaping**
   - Escape translation strings in HTML contexts
   - Use DOMPurify for all HTML construction

---

## Recommendations Summary

### Immediate Actions Required

1. **Install HTML sanitization library:**
   ```bash
   npm install isomorphic-dompurify
   ```

2. **Implement server-side sanitization in lesson validation schema**

3. **Implement client-side sanitization in LessonViewer and LessonEditor**

4. **Add HTML content length limits**

5. **Review and document iframe sandbox permissions**

### Best Practices to Adopt

1. **Defense in Depth:** Sanitize on both server and client
2. **Whitelist Approach:** Only allow specific HTML tags/attributes
3. **Content Security Policy:** Add CSP headers for additional protection
4. **Regular Security Audits:** Schedule periodic security reviews
5. **Security Testing:** Add security tests for XSS prevention

---

## Testing Recommendations

### Security Testing

1. **XSS Testing:**
   - Test with malicious HTML payloads
   - Test script injection attempts
   - Test event handler injection
   - Test data URI schemes
   - Test iframe communication vectors

2. **Input Validation Testing:**
   - Test extremely long HTML content (DoS)
   - Test malformed HTML
   - Test special characters and encoding
   - Test nested HTML structures

3. **Authorization Testing:**
   - Test cross-parish access attempts
   - Test unauthorized lesson access
   - Test privilege escalation attempts

---

## Conclusion

The catechesis module has **strong authentication and authorization** but has **critical XSS vulnerabilities** due to unsanitized HTML content. The primary risk is stored XSS attacks through lesson content.

**Priority:** Implement HTML sanitization immediately before production deployment.

**Overall Security Grade:** C+ (Good foundations, but critical XSS vulnerability)

---

**Audit Completed:** 2024
**Next Review Recommended:** After XSS fixes are implemented






