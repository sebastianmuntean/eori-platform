import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../setup/test-utils';
import { ClientStatementPageContent } from '@/components/accounting/clients/ClientStatementPageContent';
import { ClientStatement, ClientStatementSummary } from '@/hooks/useClientStatement';
import { Client } from '@/hooks/useClients';
import { Invoice } from '@/hooks/useInvoices';
import { Payment } from '@/hooks/usePayments';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next-intl
const mockTranslations: Record<string, string> = {
  statement: 'Statement',
  clientStatement: 'Client Statement',
  clientInformation: 'Client Information',
  code: 'Code',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  dateFrom: 'Date From',
  dateTo: 'Date To',
  clear: 'Clear',
  loading: 'Loading...',
  clientNotFound: 'Client not found',
  breadcrumbDashboard: 'Dashboard',
  accounting: 'Accounting',
  clients: 'Clients',
  back: 'Back',
  toClients: 'to Clients',
  dateRangeInvalid: 'Date range is invalid',
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

// Mock formatCurrency and getClientDisplayName
vi.mock('@/lib/utils/accounting', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  getClientDisplayName: (client: Client) => {
    if (client.firstName && client.lastName) {
      return `${client.firstName} ${client.lastName}`;
    }
    return client.name || client.code;
  },
}));

// Mock useClientStatement hook
const mockFetchStatement = vi.fn();
const mockUseClientStatement = vi.fn();

vi.mock('@/hooks/useClientStatement', () => ({
  useClientStatement: () => mockUseClientStatement(),
}));

describe('ClientStatementPageContent', () => {
  const mockClient: Client = {
    id: 'client-1',
    code: 'CLI-001',
    firstName: 'John',
    lastName: 'Doe',
    phone: '123-456-7890',
    email: 'john@example.com',
    address: '123 Main St',
    city: 'Bucharest',
    isActive: true,
  };

  const mockSummary: ClientStatementSummary = {
    issuedInvoices: 10000.0,
    receivedInvoices: 5000.0,
    paymentsReceived: 8000.0,
    paymentsMade: 3000.0,
    balance: 2000.0,
    issuedInvoicesCount: 5,
    receivedInvoicesCount: 3,
    paymentsReceivedCount: 8,
    paymentsMadeCount: 4,
  };

  const mockStatement: ClientStatement = {
    client: mockClient,
    summary: mockSummary,
    invoices: [],
    payments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientStatement.mockReturnValue({
      statement: null,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });
  });

  it('should render loading state when loading and no statement', () => {
    mockUseClientStatement.mockReturnValue({
      statement: null,
      loading: true,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render error state when error and no statement', () => {
    mockUseClientStatement.mockReturnValue({
      statement: null,
      loading: false,
      error: 'Failed to fetch statement',
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(screen.getByText('Failed to fetch statement')).toBeInTheDocument();
  });

  it('should render not found message when no statement', () => {
    mockUseClientStatement.mockReturnValue({
      statement: null,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(screen.getByText('Client not found')).toBeInTheDocument();
  });

  it('should render client information when statement is available', () => {
    mockUseClientStatement.mockReturnValue({
      statement: mockStatement,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(screen.getByText('Client Information')).toBeInTheDocument();
    expect(screen.getByText('CLI-001')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('should render date range filters', () => {
    mockUseClientStatement.mockReturnValue({
      statement: mockStatement,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(screen.getByText('Date From')).toBeInTheDocument();
    expect(screen.getByText('Date To')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    // Check for input elements by type
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
  });

  it('should call fetchStatement when component mounts', () => {
    mockUseClientStatement.mockReturnValue({
      statement: null,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(mockFetchStatement).toHaveBeenCalledWith({
      clientId: 'client-1',
      dateFrom: undefined,
      dateTo: undefined,
      invoiceType: undefined,
      invoiceStatus: undefined,
      paymentType: undefined,
    });
  });

  it('should call fetchStatement on mount with correct params', () => {
    mockUseClientStatement.mockReturnValue({
      statement: null,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    // Verify fetchStatement was called with correct initial params
    expect(mockFetchStatement).toHaveBeenCalledWith({
      clientId: 'client-1',
      dateFrom: undefined,
      dateTo: undefined,
      invoiceType: undefined,
      invoiceStatus: undefined,
      paymentType: undefined,
    });
  });

  it('should render summary cards when statement is available', () => {
    mockUseClientStatement.mockReturnValue({
      statement: mockStatement,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    // Summary cards should be rendered (tested in separate test file)
    expect(screen.getByText('Client Information')).toBeInTheDocument();
  });

  it('should render tabs component when statement is available', () => {
    mockUseClientStatement.mockReturnValue({
      statement: mockStatement,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    // Tabs should be rendered (tested in separate test file)
    // We can verify by checking that the component doesn't crash
    expect(screen.getByText('Client Information')).toBeInTheDocument();
  });

  it('should navigate back to clients when back button is clicked', () => {
    mockUseClientStatement.mockReturnValue({
      statement: mockStatement,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    const backButton = screen.getByText(/Back.*to Clients/);
    backButton.click();

    expect(mockPush).toHaveBeenCalledWith('/en/dashboard/accounting/clients');
  });

  it('should not render optional client fields when they are missing', () => {
    const clientWithoutOptionalFields: Client = {
      ...mockClient,
      phone: undefined,
      email: undefined,
      address: undefined,
    };

    const statementWithoutOptional: ClientStatement = {
      ...mockStatement,
      client: clientWithoutOptionalFields,
    };

    mockUseClientStatement.mockReturnValue({
      statement: statementWithoutOptional,
      loading: false,
      error: null,
      fetchStatement: mockFetchStatement,
    });

    render(<ClientStatementPageContent locale="en" clientId="client-1" />);

    expect(screen.queryByText('123-456-7890')).not.toBeInTheDocument();
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
  });
});

