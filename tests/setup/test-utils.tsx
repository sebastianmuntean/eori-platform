import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

/**
 * Expanded mock messages for next-intl
 * Covers common UI elements and actions
 */
const mockMessages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    filter: 'Filter',
    clear: 'Clear',
    select: 'Select',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    noResults: 'No results found',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    description: 'Description',
    required: 'Required',
    optional: 'Optional',
    emailPlaceholder: 'Enter your email',
  },
  auth: {
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    profile: 'Profile',
    authentication: 'Authentication',
    enterEmailPassword: 'Enter your email and password to access the platform',
    accountCreatedSuccess: 'Account created successfully! You can now log in.',
    loginError: 'Authentication error',
    connectionError: 'Connection error. Please try again.',
    noAccount: "Don't have an account?",
    registerHere: 'Sign up',
    confirmPassword: 'Confirm password',
    namePlaceholder: 'John Doe',
    createAccount: 'Create a new account to access the platform',
    registrationError: 'Registration error',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
  },
  validation: {
    required: 'This field is required',
    invalid: 'Invalid value',
    minLength: 'Minimum length not met',
    maxLength: 'Maximum length exceeded',
  },
  errors: {
    generic: 'An error occurred',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    serverError: 'Server error',
  },
};

interface AllTheProvidersProps {
  children: React.ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
}

/**
 * Provider wrapper that includes NextIntl
 * Can be customized per test if needed
 */
function AllTheProviders({ 
  children, 
  locale = 'ro',
  messages = mockMessages 
}: AllTheProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @example
 * ```tsx
 * import { render, screen } from '@/tests/setup/test-utils';
 * 
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    locale?: string;
    messages?: Record<string, unknown>;
  }
) => {
  const { locale, messages, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders locale={locale} messages={messages} {...props} />
    ),
    ...renderOptions,
  });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Export custom render as default render
export { customRender as render };

// Export mock messages for use in tests
export { mockMessages };
