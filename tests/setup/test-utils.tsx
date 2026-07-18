import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enCommon from '@/locales/en/common.json';
import enMenu from '@/locales/en/menu.json';
import enAuth from '@/locales/en/auth.json';
import enOnlineForms from '@/locales/en/online-forms.json';
import enRegistry from '@/locales/en/registry.json';
import enHr from '@/locales/en/hr.json';
import enCatechesis from '@/locales/en/catechesis.json';
import enPilgrimages from '@/locales/en/pilgrimages.json';
import enProfile from '@/locales/en/profile.json';
import enAccounting from '@/locales/en/accounting.json';
import enEvents from '@/locales/en/events.json';
import enParishioners from '@/locales/en/parishioners.json';
import enCemeteries from '@/locales/en/cemeteries.json';
import enAdministration from '@/locales/en/administration.json';

/**
 * Full English message catalogs for next-intl in tests.
 * Mirrors src/i18n/request.ts so components resolve real keys.
 */
const mockMessages = {
  common: enCommon,
  menu: enMenu,
  auth: enAuth,
  'online-forms': enOnlineForms,
  registry: enRegistry,
  hr: enHr,
  catechesis: enCatechesis,
  pilgrimages: enPilgrimages,
  profile: enProfile,
  accounting: enAccounting,
  events: enEvents,
  parishioners: enParishioners,
  cemeteries: enCemeteries,
  administration: enAdministration,
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
  locale = 'en',
  messages = mockMessages,
}: AllTheProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={(error) => {
        // Allow tests to proceed when a rare key is missing; still surfaces in stderr via next-intl default in non-MISSING cases
        if (error.code === 'MISSING_MESSAGE') {
          return;
        }
      }}
      getMessageFallback={({ namespace, key }) => {
        const lastSegment = key.split('.').pop() || key;
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      }}
    >
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
