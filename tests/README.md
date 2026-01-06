# Testing Guide

This directory contains the test suite for the EORI Platform. The project uses [Vitest](https://vitest.dev/) as the testing framework, with [Testing Library](https://testing-library.com/) for React component testing.

## Table of Contents

- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking](#mocking)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Running Tests

### Run tests once
```bash
npm test
```

### Run tests in watch mode (recommended for development)
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

The test directory is organized as follows:

```
tests/
├── __mocks__/          # Manual mocks for external dependencies
│   ├── database/      # Database mocks
│   └── next/          # Next.js mocks
├── setup/             # Test setup files
│   ├── vitest.setup.ts # Global test setup
│   └── test-utils.tsx  # React testing utilities
├── utils/             # Test utilities and helpers
│   ├── db-mock.ts     # Database mocking utilities
│   ├── api-helpers.ts # API route testing helpers
│   └── fixtures.ts    # Test data fixtures
└── unit/              # Unit tests
    └── api/           # API route tests
```

## Writing Tests

### Test File Naming

Test files should follow the pattern: `*.test.ts` or `*.spec.ts` and be placed next to the file they're testing or in the corresponding location in the `tests/` directory.

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code that runs before each test
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Patterns

#### Arrange-Act-Assert (AAA) Pattern

Always structure your tests using the AAA pattern:

```typescript
it('should export Excel file', async () => {
  // Arrange: Setup test data and mocks
  const testData = createTestData();
  mockDatabase(testData);
  
  // Act: Execute the code being tested
  const response = await GET(request);
  
  // Assert: Verify the results
  expect(response.status).toBe(200);
});
```

## Mocking

### Database Mocking

The project uses a custom database mock system. Here's how to use it:

```typescript
import { createMockDatabase, setMockSelectData } from '@/../tests/utils/db-mock';
import { employees } from '@/database/schema';

// In your test
let mockEmployeesData: EmployeeFixture[] = [];

// Set up mock data
mockEmployeesData = [
  {
    id: 'emp-1',
    employeeNumber: 'EMP001',
    // ... other fields
  },
];
```

The database client is automatically mocked via `vi.mock('@/database/client')`. The mock returns data from `mockEmployeesData` when querying the employees table.

### Mocking External Libraries

#### ExcelJS

```typescript
const mockWorkbook = {
  addWorksheet: vi.fn(() => mockWorksheet),
  xlsx: {
    writeBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
  },
};

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => mockWorkbook),
  },
}));
```

#### Next.js Modules

```typescript
vi.mock('@/lib/errors', () => ({
  formatErrorResponse: vi.fn((error) => ({
    success: false,
    error: error.message,
    statusCode: 500,
  })),
  logError: vi.fn(),
}));
```

### Mocking API Requests

Use the API helpers to create mock requests:

```typescript
import { createMockRequestWithParams } from '@/../tests/utils/api-helpers';

const request = createMockRequestWithParams(
  'http://localhost/api/endpoint',
  {
    param1: 'value1',
    param2: 'value2',
  }
);
```

## Test Utilities

### API Helpers

Located in `tests/utils/api-helpers.ts`:

- `createMockRequest(url, init?)` - Create a mock Request object
- `createMockRequestWithParams(baseUrl, params)` - Create a Request with query parameters
- `extractJsonResponse<T>(response)` - Extract JSON from NextResponse
- `extractBlobResponse(response)` - Extract blob/buffer from NextResponse
- `assertJsonResponse<T>(response, expectedStatus)` - Assert JSON response with status
- `assertFileResponse(response, contentType, filename?)` - Assert file download response
- `assertErrorResponse(response, expectedStatus)` - Assert error response

### Database Mocking Utilities

Located in `tests/utils/db-mock.ts`:

- `createMockDatabase()` - Create a mock database instance
- `setMockSelectData(db, table, data)` - Set mock data for a table query
- `MockQueryBuilder` - Mock query builder class
- `MockSelectBuilder` - Mock select builder class

### Test Fixtures

Located in `tests/utils/fixtures.ts`:

- `sampleEmployees` - Sample employee data
- `sampleEmploymentContracts` - Sample contract data
- `getEmployeeById(id)` - Get employee by ID
- `getContractsByEmployeeId(employeeId)` - Get contracts for an employee

### React Testing Utilities

Located in `tests/setup/test-utils.tsx`:

- `render(ui, options?)` - Custom render function with NextIntl provider
- `mockMessages` - Mock translation messages

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on state from other tests:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset test data
  mockEmployeesData = [];
});
```

### 2. Descriptive Test Names

Use descriptive test names that explain what is being tested:

```typescript
// Good
it('should export Excel file with all employees when no filters are provided', async () => {
  // ...
});

// Bad
it('should work', async () => {
  // ...
});
```

### 3. Test Coverage

Aim for high coverage of:
- Business logic
- Error handling
- Edge cases
- Happy paths

### 4. Mock Strategy

- Mock at the boundary (database, external APIs, file system)
- Don't mock the code you're testing
- Use real implementations when possible

### 5. Async Testing

Always properly handle async operations:

```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## Examples

### Example: API Route Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/hr/reports/employees/export/route';
import { createMockRequestWithParams, assertFileResponse } from '@/../tests/utils/api-helpers';
import { sampleEmployees } from '@/../tests/utils/fixtures';

describe('GET /api/hr/reports/employees/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmployeesData = [];
  });

  it('should export Excel file with all employees', async () => {
    // Arrange
    mockEmployeesData = [sampleEmployees[0]];
    
    const request = createMockRequestWithParams(
      'http://localhost/api/hr/reports/employees/export',
      { format: 'excel' }
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(200);
    assertFileResponse(
      response,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });
});
```

### Example: Testing Error Cases

```typescript
it('should handle database query failure', async () => {
  // Arrange
  const dbError = new Error('Database connection failed');
  const { db } = await import('@/database/client');
  vi.spyOn(db, 'select').mockImplementation(() => {
    throw dbError;
  });

  const request = createMockRequestWithParams(
    'http://localhost/api/endpoint',
    {}
  );

  // Act
  const response = await GET(request);

  // Assert
  const errorData = await assertErrorResponse(response, 500);
  expect(errorData.success).toBe(false);
  expect(errorData.error).toBeDefined();
});
```

### Example: Testing Edge Cases

```typescript
it('should handle empty employee list', async () => {
  // Arrange
  mockEmployeesData = [];

  const request = createMockRequestWithParams(
    'http://localhost/api/hr/reports/employees/export',
    { format: 'excel' }
  );

  // Act
  const response = await GET(request);

  // Assert
  expect(response.status).toBe(200);
  // Verify Excel was still created (even with empty data)
  expect(mockWorkbook.addWorksheet).toHaveBeenCalled();
});
```

### Example: React Component Test

```typescript
import { render, screen } from '@/../tests/setup/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<MyComponent />);

    // Assert
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Configuration

### Vitest Configuration

The Vitest configuration is in `vitest.config.ts` at the project root. Key settings:

- **Environment**: `jsdom` for React components, `node` for API routes
- **Setup Files**: `tests/setup/vitest.setup.ts`
- **Path Aliases**: Matches `tsconfig.json` aliases (`@/*`, `@/database/*`, etc.)
- **Coverage**: Configured to exclude test files and config files

### TypeScript Configuration

Tests use the same TypeScript configuration as the main project. Path aliases are configured in `tsconfig.json` and mirrored in `vitest.config.ts`.

## Troubleshooting

### Tests not finding modules

Ensure path aliases in `vitest.config.ts` match those in `tsconfig.json`.

### Mock not working

1. Check that `vi.mock()` is called before imports
2. Verify the mock path matches the actual import path
3. Ensure mocks are reset in `beforeEach`

### Async issues

1. Always use `async/await` for async operations
2. Don't forget to `await` promises in tests
3. Use `vi.waitFor()` for DOM updates in React tests

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Mock Service Worker (MSW)](https://mswjs.io/) - For API mocking (available but not required)




