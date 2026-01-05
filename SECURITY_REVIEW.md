# Security Review Report
**Date:** 2024-12-19  
**Platform:** EORI Platform  
**Review Scope:** Comprehensive security audit of authentication, authorization, input validation, data protection, and infrastructure

---

## Executive Summary

This security review identified **15 security issues** across authentication, authorization, input validation, XSS/CSRF protection, SQL injection prevention, and infrastructure security. While the application has several good security practices in place (bcrypt password hashing, session management, rate limiting), there are critical vulnerabilities that require immediate attention.

**Risk Level Distribution:**
- 🔴 **Critical:** 3 issues
- 🟠 **High:** 5 issues
- 🟡 **Medium:** 4 issues
- 🟢 **Low:** 3 issues

---

## 1. Authentication & Authorization

### ✅ Strengths
- ✅ Bcrypt password hashing with configurable rounds (default: 12)
- ✅ Strong password validation (8+ chars, uppercase, lowercase, number, special char)
- ✅ Session-based authentication with secure cookies
- ✅ Account status checks (isActive, approvalStatus)
- ✅ Session invalidation on password change
- ✅ Rate limiting on login endpoints

### 🔴 Critical Issues

#### 1.1 CSRF Token Not Used in API Routes
**Severity:** 🔴 Critical  
**Location:** All API routes  
**Issue:** CSRF token generation exists (`src/lib/csrf.ts`) but is not validated in API routes. This leaves the application vulnerable to Cross-Site Request Forgery attacks.

**Evidence:**
```typescript
// src/lib/csrf.ts - Token generation exists
export function generateCsrfToken(): string { ... }
export async function validateCsrfToken(...): Promise<boolean> { ... }

// But no API routes use it
// src/app/api/**/route.ts - No CSRF validation found
```

**Impact:** Attackers can perform actions on behalf of authenticated users without their knowledge.

**Remediation:**
```typescript
// src/lib/api-security.ts (NEW FILE)
import { validateCsrfToken, getCsrfTokenFromHeader } from '@/lib/csrf';
import { NextResponse } from 'next/server';

export async function requireCsrfToken(request: Request): Promise<NextResponse | null> {
  // Skip CSRF for GET/HEAD/OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }

  const token = getCsrfTokenFromHeader(request.headers);
  const isValid = await validateCsrfToken(token);

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: 'CSRF token validation failed' },
      { status: 403 }
    );
  }

  return null;
}

// Usage in API routes:
// src/app/api/users/route.ts
export async function POST(request: Request) {
  const csrfError = await requireCsrfToken(request);
  if (csrfError) return csrfError;
  
  // ... rest of handler
}
```

**Priority:** Immediate - Implement CSRF protection for all state-changing operations.

---

#### 1.2 Session Cookie Security Configuration
**Severity:** 🟠 High  
**Location:** `src/lib/session.ts:57-63`

**Issue:** Session cookie `secure` flag only set in production. In development, cookies are sent over HTTP, making them vulnerable to interception.

**Current Code:**
```typescript
cookieStore.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // ⚠️ Only secure in production
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
});
```

**Remediation:**
```typescript
// Always use secure cookies, even in development if HTTPS is available
const isSecure = process.env.NODE_ENV === 'production' || 
                 process.env.FORCE_SECURE_COOKIES === 'true';

cookieStore.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
});
```

**Priority:** High - Ensure secure cookies in all environments with HTTPS.

---

#### 1.3 Excessive Console Logging of Sensitive Information
**Severity:** 🟡 Medium  
**Location:** Multiple files

**Issue:** Console logs may expose sensitive information in production if logs are accessible.

**Evidence:**
```typescript
// src/lib/auth.ts:28-32
console.log(`Step 1: Hashing password`);
// ... password operations logged

// src/lib/session.ts:72
console.log(`Step 1: Reading session token from cookie`);
```

**Remediation:**
```typescript
// src/lib/logger.ts - Use structured logging
export function logSecurityEvent(event: string, metadata?: Record<string, any>) {
  // Remove sensitive fields
  const safeMetadata = { ...metadata };
  delete safeMetadata.password;
  delete safeMetadata.token;
  delete safeMetadata.passwordHash;
  
  if (process.env.NODE_ENV === 'production') {
    // Send to secure logging service (Sentry, etc.)
    logger.info(event, safeMetadata);
  } else {
    console.log(`[SECURITY] ${event}`, safeMetadata);
  }
}

// Replace console.log with:
logSecurityEvent('Password hashing initiated', { userId });
```

**Priority:** Medium - Remove sensitive data from logs.

---

### 🟠 High Priority Issues

#### 1.4 Missing Permission Checks in Some API Routes
**Severity:** 🟠 High  
**Location:** Various API routes

**Issue:** While page-level permissions were recently added, some API routes may still lack permission checks.

**Remediation:**
```typescript
// Ensure all API routes check permissions:
export async function POST(request: Request) {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check specific permission
  await requirePermission(ONLINE_FORMS_PERMISSIONS.CREATE);
  
  // ... rest of handler
}
```

**Priority:** High - Audit all API routes for permission checks.

---

## 2. Input Validation & Sanitization

### ✅ Strengths
- ✅ Zod schema validation in many routes
- ✅ Basic XSS sanitization function exists
- ✅ SQL injection prevention via Drizzle ORM (parameterized queries)

### 🔴 Critical Issues

#### 2.1 SQL Injection Risk in Dynamic SQL Execution
**Severity:** 🔴 Critical  
**Location:** `src/app/api/online-forms/mapping-datasets/test-sql/route.ts:76`

**Issue:** Raw SQL execution using `sql.raw()` with user-provided input, even after validation. The validation is not comprehensive enough.

**Current Code:**
```typescript
const limitedQuery = testQuery.includes('LIMIT') 
  ? testQuery 
  : `${testQuery} LIMIT 1`;

const result = await db.execute(sql.raw(limitedQuery)); // ⚠️ Raw SQL execution
```

**Problems:**
1. SQL validator (`src/lib/online-forms/sql-validator.ts`) uses simple string matching
2. Can be bypassed with comments: `SELECT * FROM users -- DROP TABLE users;`
3. No protection against UNION-based attacks
4. Table name validation is basic regex

**Remediation:**
```typescript
// src/lib/online-forms/sql-validator.ts - Enhanced validation
import { sql } from 'drizzle-orm';

export function validateSqlQueryEnhanced(
  sqlQuery: string,
  allowedTables: string[]
): { valid: boolean; error?: string; safeQuery?: string } {
  // 1. Remove comments
  const withoutComments = sqlQuery
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. Check for forbidden keywords (case-insensitive, whole word)
  const forbiddenPattern = new RegExp(
    `\\b(${FORBIDDEN_KEYWORDS.join('|')})\\b`,
    'gi'
  );
  if (forbiddenPattern.test(withoutComments)) {
    return { valid: false, error: 'Query contains forbidden keywords' };
  }

  // 3. Parse and validate table names using SQL parser (consider using node-sql-parser)
  // 4. Only allow SELECT statements
  if (!withoutComments.trim().toUpperCase().startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries allowed' };
  }

  // 5. Build safe parameterized query
  // Instead of raw SQL, use Drizzle's query builder
  return { valid: true, safeQuery: withoutComments };
}

// In route handler:
const validation = validateSqlQueryEnhanced(sqlQuery, allowedTables);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}

// Use EXPLAIN instead of execution, or use query builder
const explainResult = await db.execute(
  sql.raw(`EXPLAIN (FORMAT JSON) ${validation.safeQuery}`)
);
```

**Alternative:** Use a SQL parser library:
```typescript
import { Parser } from 'node-sql-parser';

const parser = new Parser();
try {
  const ast = parser.astify(sqlQuery);
  // Validate AST structure
  if (ast.type !== 'select') {
    throw new Error('Only SELECT queries allowed');
  }
  // Validate table names from AST
  const tables = extractTablesFromAST(ast);
  for (const table of tables) {
    if (!allowedTables.includes(table)) {
      throw new Error(`Table ${table} not allowed`);
    }
  }
} catch (error) {
  return { valid: false, error: error.message };
}
```

**Priority:** Immediate - This is a critical SQL injection vector.

---

#### 2.2 XSS Vulnerability via dangerouslySetInnerHTML
**Severity:** 🔴 Critical  
**Location:** 
- `src/components/email-templates/EmailTemplatePreview.tsx:112`
- `src/lib/utils/accounting.ts:102`
- `src/app/[locale]/dashboard/accounting/contracts/page.tsx:979`

**Issue:** User-controlled HTML is rendered without sanitization using `dangerouslySetInnerHTML`.

**Current Code:**
```typescript
// EmailTemplatePreview.tsx
<div
  dangerouslySetInnerHTML={{ __html: previewHtml }} // ⚠️ Unsanitized HTML
/>
```

**Impact:** If email templates contain user input, XSS attacks are possible.

**Remediation:**
```typescript
// Install: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify';

// In component:
const sanitizedHtml = DOMPurify.sanitize(previewHtml, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
});

<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

**For Server-Side (Next.js):**
```typescript
// src/lib/sanitize.ts
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}
```

**Priority:** Immediate - XSS vulnerabilities are critical.

---

### 🟠 High Priority Issues

#### 2.3 Weak Input Sanitization
**Severity:** 🟠 High  
**Location:** `src/lib/validation.ts:6-10`

**Issue:** Sanitization only removes `<` and `>`, which is insufficient.

**Current Code:**
```typescript
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Only removes < and >
    .trim();
}
```

**Remediation:**
```typescript
import DOMPurify from 'dompurify';

export function sanitizeString(input: string): string {
  // Remove HTML tags and encode special characters
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

// For HTML content that needs to be preserved:
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: [],
  });
}
```

**Priority:** High - Improve input sanitization.

---

#### 2.4 File Upload Security
**Severity:** 🟠 High  
**Location:** Multiple file upload endpoints

**Issue:** File uploads may lack proper validation:
- File type validation
- File size limits (some exist, but may be inconsistent)
- Filename sanitization
- Virus scanning

**Evidence:**
```typescript
// src/app/api/pilgrimages/[id]/documents/route.ts
const file = formData.get('file') as File;
// No MIME type validation visible
// No filename sanitization
```

**Remediation:**
```typescript
// src/lib/file-upload-security.ts
import { extname } from 'path';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds maximum allowed size' };
  }

  // 2. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // 3. Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);
  if (sanitizedFilename !== file.name) {
    return { valid: false, error: 'Invalid filename' };
  }

  // 4. Check extension matches MIME type
  const ext = extname(file.name).toLowerCase();
  const expectedExts: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  };
  
  if (expectedExts[file.type] && !expectedExts[file.type].includes(ext)) {
    return { valid: false, error: 'File extension does not match file type' };
  }

  return { valid: true };
}

function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const basename = filename.replace(/^.*[\\/]/, '');
  // Remove dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Usage in route:
const file = formData.get('file') as File;
const validation = validateFileUpload(file);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

**Priority:** High - File uploads are common attack vectors.

---

## 3. Data Protection

### ✅ Strengths
- ✅ Passwords hashed with bcrypt
- ✅ Session tokens are cryptographically random
- ✅ Error messages don't expose sensitive data in production

### 🟠 High Priority Issues

#### 3.1 Environment Variables Exposure Risk
**Severity:** 🟠 High  
**Location:** Multiple files using `process.env`

**Issue:** `NEXT_PUBLIC_*` environment variables are exposed to the client. Some sensitive values might be accidentally exposed.

**Evidence:**
```typescript
// next.config.js - Sentry DSN is public
process.env.NEXT_PUBLIC_SENTRY_DSN

// This is fine, but ensure no secrets use NEXT_PUBLIC_ prefix
```

**Remediation:**
1. Audit all `NEXT_PUBLIC_*` variables
2. Ensure no secrets use this prefix
3. Document which variables are safe to expose

```typescript
// src/lib/config/env.ts - Centralized env validation
import { z } from 'zod';

const envSchema = z.object({
  // Server-only (never exposed to client)
  DATABASE_URL: z.string().min(1),
  BREVO_API_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  
  // Public (safe to expose)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

**Priority:** High - Prevent accidental secret exposure.

---

#### 3.2 Information Disclosure in Error Messages
**Severity:** 🟡 Medium  
**Location:** Error handling throughout application

**Issue:** Development error messages may leak sensitive information if not properly filtered.

**Remediation:**
```typescript
// src/lib/errors.ts - Enhanced error sanitization
export function sanitizeError(error: unknown): {
  message: string;
  code?: string;
} {
  if (process.env.NODE_ENV === 'production') {
    // Never expose stack traces or internal details
    if (error instanceof Error) {
      // Only expose safe error messages
      const safeMessages = [
        'Invalid credentials',
        'Resource not found',
        'Validation failed',
      ];
      
      if (safeMessages.includes(error.message)) {
        return { message: error.message };
      }
      
      return { message: 'An error occurred', code: 'INTERNAL_ERROR' };
    }
    return { message: 'An error occurred' };
  }
  
  // Development: show full details
  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    code: error instanceof Error ? error.name : undefined,
  };
}
```

**Priority:** Medium - Prevent information leakage.

---

## 4. Infrastructure Security

### ✅ Strengths
- ✅ Security headers implemented (CSP, X-Frame-Options, etc.)
- ✅ HSTS enabled in production
- ✅ Rate limiting implemented

### 🟡 Medium Priority Issues

#### 4.1 Content Security Policy Too Permissive
**Severity:** 🟡 Medium  
**Location:** `src/lib/security-headers.ts:27-30`

**Issue:** CSP allows `'unsafe-eval'` and `'unsafe-inline'`, which reduces XSS protection.

**Current Code:**
```typescript
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ..."
);
```

**Remediation:**
```typescript
// Implement nonce-based CSP
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// In middleware or layout
const nonce = generateNonce();
response.headers.set(
  'Content-Security-Policy',
  `default-src 'self'; ` +
  `script-src 'self' 'nonce-${nonce}'; ` +
  `style-src 'self' 'nonce-${nonce}'; ` +
  `img-src 'self' data: https:; ` +
  `font-src 'self' data:; ` +
  `connect-src 'self'; ` +
  `frame-ancestors 'none';`
);

// Pass nonce to components via context
```

**Priority:** Medium - Improve CSP implementation.

---

#### 4.2 Missing Dependency Security Scanning
**Severity:** 🟡 Medium

**Issue:** No automated dependency vulnerability scanning detected.

**Remediation:**
1. Add `npm audit` to CI/CD pipeline
2. Use Dependabot or Snyk for automated updates
3. Review and update dependencies regularly

```json
// package.json - Add scripts
{
  "scripts": {
    "security:audit": "npm audit",
    "security:fix": "npm audit fix",
    "security:check": "npm audit --audit-level=moderate"
  }
}
```

**Priority:** Medium - Implement dependency scanning.

---

#### 4.3 CORS Configuration
**Severity:** 🟢 Low  
**Location:** `src/lib/cors.ts`

**Issue:** CORS configuration exists but may need review for production.

**Remediation:**
```typescript
// Ensure CORS is properly configured
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

// In production, never use '*'
if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be set in production');
}
```

**Priority:** Low - Review CORS configuration.

---

## 5. Additional Security Recommendations

### 5.1 Implement Security Headers for API Routes
**Priority:** Medium

```typescript
// src/lib/api-security.ts
export function addApiSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}
```

### 5.2 Add Request ID Tracking
**Priority:** Low

```typescript
// Add request ID for audit trails
const requestId = crypto.randomUUID();
response.headers.set('X-Request-ID', requestId);
```

### 5.3 Implement Account Lockout
**Priority:** Medium

```typescript
// After N failed login attempts, lock account temporarily
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
```

---

## Security Checklist

- [x] Verified proper authentication mechanisms (bcrypt, sessions)
- [x] Checked authorization controls (RBAC implemented)
- [x] Reviewed session management (secure cookies, expiration)
- [x] Ensured secure password policies (strong validation)
- [x] Identified SQL injection vulnerabilities (dynamic SQL execution)
- [x] Checked for XSS attack vectors (dangerouslySetInnerHTML)
- [x] Validated user inputs (Zod schemas, but needs improvement)
- [x] Ensured sensitive data encryption (passwords hashed)
- [x] Checked for data exposure in logs (excessive console.log)
- [x] Reviewed dependency security (needs automated scanning)
- [x] Analyzed CORS policies (needs production review)
- [ ] **CSRF protection not implemented in API routes** ⚠️
- [ ] **SQL injection risk in dynamic queries** ⚠️
- [ ] **XSS via dangerouslySetInnerHTML** ⚠️

---

## Remediation Priority

### Immediate (This Week)
1. ✅ Implement CSRF protection in API routes
2. ✅ Fix SQL injection in dynamic SQL execution
3. ✅ Sanitize HTML in dangerouslySetInnerHTML usage

### High Priority (This Month)
4. ✅ Improve input sanitization functions
5. ✅ Add file upload security validation
6. ✅ Audit environment variables
7. ✅ Review and fix session cookie security

### Medium Priority (Next Month)
8. ✅ Remove sensitive data from console logs
9. ✅ Implement nonce-based CSP
10. ✅ Add dependency security scanning
11. ✅ Enhance error message sanitization

### Low Priority (Ongoing)
12. ✅ Review CORS configuration
13. ✅ Add request ID tracking
14. ✅ Implement account lockout mechanism

---

## Conclusion

The EORI Platform has a solid security foundation with proper password hashing, session management, and rate limiting. However, **3 critical vulnerabilities** require immediate attention:

1. **CSRF protection missing** - All state-changing API operations are vulnerable
2. **SQL injection risk** - Dynamic SQL execution with insufficient validation
3. **XSS vulnerabilities** - Unsanitized HTML rendering

Addressing these issues should be the top priority. The high-priority items (input sanitization, file uploads, environment variables) should follow within the month.

**Overall Security Posture:** 🟡 **Moderate** - Good foundation, but critical gaps need immediate attention.

---

## Next Steps

1. **Immediate:** Fix the 3 critical vulnerabilities
2. **This Week:** Review and implement all high-priority fixes
3. **This Month:** Complete medium-priority improvements
4. **Ongoing:** Implement security monitoring and regular audits

---

**Report Generated:** 2024-12-19  
**Reviewer:** Security Audit System  
**Next Review:** Recommended in 3 months or after major changes
