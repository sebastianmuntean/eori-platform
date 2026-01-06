# Login Page Unit Tests

## Overview

Comprehensive unit tests for the login page component (`src/app/[locale]/(auth)/login/page.tsx`).

## Test Coverage

### ✅ Initial Render Tests
- Renders login form with all required elements
- Handles default redirect path
- Handles custom redirect from search params
- Shows success message when `registered=true` in URL
- Hides success message when not registered

### ✅ Form Input Handling
- Updates email input value correctly
- Updates password input value correctly
- Disables inputs during loading state

### ✅ Form Submission - Success Cases
- Successfully submits form and redirects to default path
- Redirects to custom path from search params
- Dispatches `auth-refresh` event on successful login
- Handles redirect with special characters in URL

### ✅ Form Submission - Error Cases
- Displays error message when API returns error
- Displays default error message when API error has no message
- Handles `success: false` response
- Handles network errors gracefully
- Handles JSON parsing errors

### ✅ Loading States
- Shows loading state during form submission
- Clears errors when submitting again
- Prevents multiple rapid submissions

### ✅ Form Validation
- Prevents submission with empty email (HTML5 validation)
- Prevents submission with empty password (HTML5 validation)

### ✅ Link Navigation
- Register link points to correct path

### ✅ Edge Cases
- Handles multiple rapid submissions
- Handles redirect with special characters

## Test Structure

Tests are organized using `describe` blocks:
1. **Initial Render** - Component rendering and initial state
2. **Form Input Handling** - User input interactions
3. **Form Submission - Success Cases** - Successful login scenarios
4. **Form Submission - Error Cases** - Error handling scenarios
5. **Loading States** - Loading and disabled states
6. **Form Validation** - HTML5 validation behavior
7. **Link Navigation** - Navigation links
8. **Edge Cases** - Boundary conditions and special cases

## Mocking

### Next.js Navigation
- `useRouter()` - Mocked to track navigation calls
- `useSearchParams()` - Mocked to provide URL search params

### Fetch API
- Global `fetch` is mocked to simulate API responses
- Supports both success and error scenarios

### Window Events
- `window.dispatchEvent` - Mocked to verify auth-refresh events

### Timers
- Uses Vitest's fake timers for testing setTimeout behavior

## Running Tests

```bash
# Run all login page tests
npm test tests/unit/pages/login

# Run in watch mode
npm run test:watch tests/unit/pages/login

# Run with coverage
npm run test:coverage tests/unit/pages/login
```

## Test Patterns

### Arrange-Act-Assert Pattern
All tests follow the AAA pattern:
```typescript
it('should do something', () => {
  // Arrange: Set up mocks and initial state
  mockFetch.mockResolvedValueOnce({ ... });
  render(<LoginPage />);
  
  // Act: Perform the action
  fireEvent.submit(form);
  
  // Assert: Verify the outcome
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});
```

### Async Testing
Uses `waitFor` for async operations:
```typescript
await waitFor(() => {
  expect(screen.getByText('Error message')).toBeInTheDocument();
});
```

### Form Querying
Since forms don't have `role="form"` by default, we query them via input elements:
```typescript
const form = screen.getByLabelText(/email/i).closest('form')!;
fireEvent.submit(form);
```

## Coverage Goals

- ✅ All public methods tested
- ✅ Edge cases covered
- ✅ Error conditions handled
- ✅ Loading states verified
- ✅ User interactions tested
- ✅ Navigation verified

## Notes

- Tests use the project's test utilities from `@/tests/setup/test-utils`
- Translation keys are mocked via `next-intl` provider
- All external dependencies are properly mocked
- Tests are isolated and don't depend on each other

