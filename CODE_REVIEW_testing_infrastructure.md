# Code Review: Testing Infrastructure Setup

## Overview

This review covers the testing infrastructure setup including Vitest configuration, test utilities, mocks, and fixtures. The implementation provides a solid foundation for testing, but several critical issues need to be addressed to ensure compatibility with the actual codebase patterns.

## Review Checklist

### Functionality

- [x] Intended behavior works and matches requirements
- [⚠️] Edge cases handled gracefully
- [⚠️] Error handling is appropriate and informative

### Code Quality

- [x] Code structure is clear and maintainable
- [⚠️] No unnecessary duplication or dead code
- [⚠️] Tests/documentation updated as needed

### Security & Safety

- [x] No obvious security vulnerabilities introduced
- [x] Inputs validated and outputs sanitized
- [x] Sensitive data handled correctly

## Critical Issues

### 1. Database Mock Incompleteness (High Priority)

**Location:** `tests/utils/db-mock.ts`, `tests/__mocks__/database/client.ts`

**Issue:** The database mock doesn't support many Drizzle ORM patterns used throughout the codebase:

```typescript
// ❌ Not supported in current mock:
db.select({ count: sql<number>`count(*)` }).from(table)
db.select({ ...columns }).from(table).leftJoin(...)
db.select().from(table).where(...).orderBy(...).limit(...).offset(...)
```

**Evidence from codebase:**
- `src/app/api/parishes/route.ts:175-184` uses `.select({ count: sql... })`
- `src/app/api/online-forms/route.ts:95-124` uses `.leftJoin()`, `.orderBy()`, `.limit()`, `.offset()`
- `src/app/api/hr/reports/employees/export/route.ts:28-29` uses conditional `.where()` chaining

**Impact:** Tests will fail when trying to use these patterns.

**Recommendation:**
```typescript
// Add to MockQueryBuilder:
orderBy(orderByClause: any): this
limit(count: number): this
offset(count: number): this
leftJoin(table: PgTable, condition: SQL): this

// Add to MockSelectBuilder:
select(columns?: any): MockSelectBuilder // Support both select() and select({...})
```

### 2. Table Name Extraction Unreliable (Medium Priority)

**Location:** `tests/utils/db-mock.ts:52, 63, 72`

**Issue:** Table name extraction using `Symbol.for('drizzle:Name')` may not work reliably:

```typescript
const tableName = (table as any)._[Symbol.for('drizzle:Name')] || (table as any).name || 'unknown';
```

**Problem:** This relies on internal Drizzle implementation details that may change or not exist.

**Recommendation:**
- Use a Map to associate table objects with mock data instead of trying to extract names
- Or use a WeakMap to store mock data per table instance
- Consider using `table[Symbol.for('drizzle:Name')]` directly if available

### 3. Console Suppression May Hide Errors (Medium Priority)

**Location:** `tests/setup/vitest.setup.ts:12-20`

**Issue:** All console methods are mocked to `vi.fn()`, which will suppress all console output including errors:

```typescript
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(), // ⚠️ This hides errors!
};
```

**Impact:** Test failures might be harder to debug, and actual errors in code under test won't be visible.

**Recommendation:**
- Only suppress `console.log` and `console.debug` in production-like tests
- Keep `console.error` and `console.warn` functional, or at least log them
- Consider making this configurable per test suite

### 4. Database Mock Module Path Issues (Medium Priority)

**Location:** `tests/__mocks__/database/client.ts:48-54`

**Issue:** The mock uses `vi.mock()` at module level, which may not work correctly with Vitest's module resolution:

```typescript
vi.mock('@/database/client', () => ({
  db: getMockDatabase(),
}));

vi.mock('../../database/client', () => ({
  db: getMockDatabase(),
}));
```

**Problem:**
- `vi.mock()` should be in test files, not in mock implementation files
- The relative path `../../database/client` may not resolve correctly
- The mock creates a singleton that may cause test isolation issues

**Recommendation:**
- Remove `vi.mock()` from this file
- Create a setup file that handles mocking, or use manual mocks properly
- Ensure each test gets a fresh mock database instance

### 5. Missing Query Builder Methods (High Priority)

**Location:** `tests/utils/db-mock.ts`

**Issue:** The mock doesn't implement methods commonly used in the codebase:

**Missing methods:**
- `.select({ ...columns })` - object-based column selection
- `.leftJoin()`, `.innerJoin()`, `.rightJoin()` - join operations
- `.orderBy()` - sorting
- `.limit()` and `.offset()` - pagination
- `.groupBy()` - grouping (used in some queries)

**Evidence:**
```typescript
// From src/app/api/online-forms/route.ts:102-124
const forms = await db
  .select({ id: onlineForms.id, ... })
  .from(onlineForms)
  .leftJoin(parishes, eq(onlineForms.parishId, parishes.id))
  .where(whereClause)
  .orderBy(orderBy)
  .limit(pageSize)
  .offset(offset);
```

**Recommendation:** Implement these methods in the mock builders.

## Moderate Issues

### 6. NextIntl Mock Messages Too Minimal (Low Priority)

**Location:** `tests/setup/test-utils.tsx:6-18`

**Issue:** The mock messages only include a few common keys:

```typescript
const mockMessages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    // ... only 8 keys
  },
};
```

**Impact:** Tests that use other translation keys will fail or show missing translation warnings.

**Recommendation:**
- Expand the mock messages to include more common keys
- Or make it configurable per test
- Consider loading actual translation files in tests

### 7. Environment Variable Defaults (Low Priority)

**Location:** `tests/setup/vitest.setup.ts:5, 9`

**Issue:** Hardcoded default values may mask configuration issues:

```typescript
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
```

**Recommendation:**
- Use a test-specific database URL that clearly indicates it's for testing
- Document that these are test defaults
- Consider failing fast if critical env vars are missing

### 8. API Helper Error Handling (Low Priority)

**Location:** `tests/utils/api-helpers.ts:39-43`

**Issue:** `extractJsonResponse` doesn't handle non-JSON responses gracefully:

```typescript
export async function extractJsonResponse<T = any>(
  response: NextResponse
): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T; // ⚠️ Will throw if not JSON
}
```

**Recommendation:**
- Add try-catch with informative error message
- Or validate content-type before parsing

### 9. Missing Type Safety in Mocks (Low Priority)

**Location:** `tests/utils/db-mock.ts` (throughout)

**Issue:** Heavy use of `any` types reduces type safety:

```typescript
private _mockDataMap: Map<string, any[]> = new Map();
```

**Recommendation:**
- Use generics where possible
- At minimum, document expected types
- Consider using `unknown` instead of `any` and add type guards

## Positive Aspects

1. **Well-structured directory organization** - Clear separation of concerns
2. **Comprehensive fixture data** - Good sample data for HR module
3. **Good API helper functions** - Useful utilities for testing API routes
4. **Proper TypeScript usage** - Type definitions are present
5. **Documentation** - JSDoc comments are helpful

## Recommendations Summary

### Immediate Actions Required

1. **Extend database mock** to support:
   - `.select({ ...columns })` pattern
   - `.leftJoin()`, `.orderBy()`, `.limit()`, `.offset()`
   - `.select({ count: sql... })` pattern

2. **Fix table name extraction** - Use WeakMap or instance-based mapping

3. **Fix console suppression** - Don't suppress `console.error` and `console.warn`

4. **Remove `vi.mock()` from mock files** - Move to test setup or individual test files

### Short-term Improvements

5. Expand NextIntl mock messages
6. Add error handling to API helpers
7. Improve type safety in mocks
8. Add documentation for using the mocks

### Long-term Enhancements

9. Add integration test examples
10. Create a testing guide/README
11. Add performance testing utilities
12. Consider adding snapshot testing utilities

## Testing the Mocks

Before approving, verify the mocks work with actual code patterns:

```typescript
// Test case to verify:
describe('Database Mock Compatibility', () => {
  it('should support select with object columns', async () => {
    const db = createMockDatabase();
    setMockSelectData(db, employees, sampleEmployees);
    
    const result = await db
      .select({ id: employees.id, name: employees.firstName })
      .from(employees);
    
    expect(result).toBeDefined();
  });

  it('should support leftJoin', async () => {
    // Test leftJoin pattern
  });

  it('should support orderBy, limit, offset', async () => {
    // Test pagination pattern
  });
});
```

## Conclusion

The testing infrastructure provides a good foundation, but **critical gaps in database mock functionality** must be addressed before it can be used effectively with the existing codebase. The mock needs to support the full range of Drizzle ORM patterns used throughout the application.

**Status:** ⚠️ **Needs Work** - Address critical issues before use in production tests.

**Priority:** Fix database mock completeness (Issues #1, #5) before writing actual tests.

