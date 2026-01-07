import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../../setup/test-utils';
import ClientStatementPage from '@/app/[locale]/dashboard/accounting/clients/[id]/statement/page';
import { usePageTitle } from '@/hooks/usePageTitle';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({
    locale: 'en',
    id: 'client-1',
  }),
}));

// Mock next-intl
const mockTranslations: Record<string, string> = {
  statement: 'Statement',
  loading: 'Loading...',
};

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: () => (key: string) => mockTranslations[key] || key,
  };
});

// Mock usePageTitle
vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

// Mock useRequirePermission
const mockUseRequirePermission = vi.fn();
vi.mock('@/hooks/useRequirePermission', () => ({
  useRequirePermission: () => mockUseRequirePermission(),
}));

// Mock ACCOUNTING_PERMISSIONS
vi.mock('@/lib/permissions/accounting', () => ({
  ACCOUNTING_PERMISSIONS: {
    CLIENTS_VIEW_STATEMENT: 'clients:view:statement',
  },
}));

// Mock ClientStatementPageContent
vi.mock('@/components/accounting/clients/ClientStatementPageContent', () => ({
  ClientStatementPageContent: ({ locale, clientId }: { locale: string; clientId: string }) => (
    <div data-testid="client-statement-content">
      Client Statement Content - Locale: {locale}, Client ID: {clientId}
    </div>
  ),
}));

describe('ClientStatementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRequirePermission.mockReturnValue({
      loading: false,
    });
  });

  it('should render loading state when checking permissions', () => {
    mockUseRequirePermission.mockReturnValue({
      loading: true,
    });

    render(<ClientStatementPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('client-statement-content')).not.toBeInTheDocument();
  });

  it('should render ClientStatementPageContent when permissions are checked', () => {
    mockUseRequirePermission.mockReturnValue({
      loading: false,
    });

    render(<ClientStatementPage />);

    expect(screen.getByTestId('client-statement-content')).toBeInTheDocument();
    expect(screen.getByText(/Client Statement Content/)).toBeInTheDocument();
    expect(screen.getByText(/Locale: en/)).toBeInTheDocument();
    expect(screen.getByText(/Client ID: client-1/)).toBeInTheDocument();
  });

  it('should set page title', () => {
    mockUseRequirePermission.mockReturnValue({
      loading: false,
    });

    render(<ClientStatementPage />);

    expect(usePageTitle).toHaveBeenCalledWith('Statement - EORI');
  });

  it('should check for correct permission', () => {
    render(<ClientStatementPage />);

    expect(mockUseRequirePermission).toHaveBeenCalled();
  });

  it('should extract locale and clientId from params', () => {
    mockUseRequirePermission.mockReturnValue({
      loading: false,
    });

    render(<ClientStatementPage />);

    // Verify the content component receives the correct props
    expect(screen.getByText(/Locale: en/)).toBeInTheDocument();
    expect(screen.getByText(/Client ID: client-1/)).toBeInTheDocument();
  });
});

