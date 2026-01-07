import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../setup/test-utils';
import { ClientStatementSummaryCards } from '@/components/accounting/clients/ClientStatementSummaryCards';
import { ClientStatementSummary } from '@/hooks/useClientStatement';

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: () => (key: string) => {
      const translations: Record<string, string> = {
        issuedInvoices: 'Issued Invoices',
        receivedInvoices: 'Received Invoices',
        paymentsReceived: 'Payments Received',
        paymentsMade: 'Payments Made',
        finalBalance: 'Final Balance',
        invoices: 'invoices',
        payments: 'payments',
        clientOwes: 'Client owes',
        weOwe: 'We owe',
      };
      return translations[key] || key;
    },
  };
});

// Mock formatCurrency
vi.mock('@/lib/utils/accounting', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

describe('ClientStatementSummaryCards', () => {
  const mockSummary: ClientStatementSummary = {
    issuedInvoices: 10000.5,
    receivedInvoices: 5000.25,
    paymentsReceived: 8000.0,
    paymentsMade: 3000.75,
    balance: 2000.0,
    issuedInvoicesCount: 5,
    receivedInvoicesCount: 3,
    paymentsReceivedCount: 8,
    paymentsMadeCount: 4,
  };

  it('should render all summary cards', () => {
    render(<ClientStatementSummaryCards summary={mockSummary} />);

    expect(screen.getByText('Issued Invoices')).toBeInTheDocument();
    expect(screen.getByText('Received Invoices')).toBeInTheDocument();
    expect(screen.getByText('Payments Received')).toBeInTheDocument();
    expect(screen.getByText('Payments Made')).toBeInTheDocument();
    expect(screen.getByText('Final Balance')).toBeInTheDocument();
  });

  it('should display correct amounts', () => {
    render(<ClientStatementSummaryCards summary={mockSummary} />);

    expect(screen.getByText('$10000.50')).toBeInTheDocument(); // issuedInvoices
    expect(screen.getByText('$5000.25')).toBeInTheDocument(); // receivedInvoices
    expect(screen.getByText('$8000.00')).toBeInTheDocument(); // paymentsReceived
    expect(screen.getByText('$3000.75')).toBeInTheDocument(); // paymentsMade
    expect(screen.getByText('$2000.00')).toBeInTheDocument(); // balance
  });

  it('should display correct counts for invoices and payments', () => {
    render(<ClientStatementSummaryCards summary={mockSummary} />);

    expect(screen.getByText('5 invoices')).toBeInTheDocument();
    expect(screen.getByText('3 invoices')).toBeInTheDocument();
    expect(screen.getByText('8 payments')).toBeInTheDocument();
    expect(screen.getByText('4 payments')).toBeInTheDocument();
  });

  it('should display "Client owes" when balance is positive', () => {
    const positiveBalanceSummary: ClientStatementSummary = {
      ...mockSummary,
      balance: 1000.0,
    };

    render(<ClientStatementSummaryCards summary={positiveBalanceSummary} />);

    expect(screen.getByText('Client owes')).toBeInTheDocument();
  });

  it('should display "We owe" when balance is negative', () => {
    const negativeBalanceSummary: ClientStatementSummary = {
      ...mockSummary,
      balance: -1000.0,
    };

    render(<ClientStatementSummaryCards summary={negativeBalanceSummary} />);

    expect(screen.getByText('We owe')).toBeInTheDocument();
  });

  it('should display "Client owes" when balance is zero', () => {
    const zeroBalanceSummary: ClientStatementSummary = {
      ...mockSummary,
      balance: 0,
    };

    render(<ClientStatementSummaryCards summary={zeroBalanceSummary} />);

    expect(screen.getByText('Client owes')).toBeInTheDocument();
  });

  it('should apply correct color classes for balance', () => {
    const positiveBalanceSummary: ClientStatementSummary = {
      ...mockSummary,
      balance: 1000.0,
    };

    const { container } = render(<ClientStatementSummaryCards summary={positiveBalanceSummary} />);
    const balanceCard = container.querySelector('.text-success');
    expect(balanceCard).toBeInTheDocument();
  });

  it('should apply danger color class for negative balance', () => {
    const negativeBalanceSummary: ClientStatementSummary = {
      ...mockSummary,
      balance: -1000.0,
    };

    const { container } = render(<ClientStatementSummaryCards summary={negativeBalanceSummary} />);
    const balanceCard = container.querySelector('.text-danger');
    expect(balanceCard).toBeInTheDocument();
  });

  it('should have border-primary class on balance card', () => {
    const { container } = render(<ClientStatementSummaryCards summary={mockSummary} />);
    const balanceCard = container.querySelector('.border-2.border-primary');
    expect(balanceCard).toBeInTheDocument();
  });

  it('should render 5 cards in total', () => {
    const { container } = render(<ClientStatementSummaryCards summary={mockSummary} />);
    const cards = container.querySelectorAll('[class*="grid"] > div > div');
    // Each card is wrapped, so we check for the grid structure
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBe(5);
  });
});

