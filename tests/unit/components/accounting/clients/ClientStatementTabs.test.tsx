import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../setup/test-utils';
import { ClientStatementTabs } from '@/components/accounting/clients/ClientStatementTabs';
import { Invoice } from '@/hooks/useInvoices';
import { Payment } from '@/hooks/usePayments';

// Mock next-intl
const mockTranslations: Record<string, string> = {
  invoices: 'Invoices',
  payments: 'Payments',
  invoiceNumber: 'Invoice Number',
  date: 'Date',
  dueDate: 'Due Date',
  invoiceType: 'Invoice Type',
  status: 'Status',
  total: 'Total',
  paymentNumber: 'Payment Number',
  type: 'Type',
  amount: 'Amount',
  description: 'Description',
  issued: 'Issued',
  received: 'Received',
  income: 'Income',
  expense: 'Expense',
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  pending: 'Pending',
  completed: 'Completed',
  allTypes: 'All Types',
  allStatuses: 'All Statuses',
};

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: () => (key: string) => mockTranslations[key] || key,
  };
});

// Mock formatCurrency
vi.mock('@/lib/utils/accounting', () => ({
  formatCurrency: (amount: string, currency?: string) => {
    const num = parseFloat(amount);
    return `${currency || 'RON'} ${num.toFixed(2)}`;
  },
}));

// Mock Table component
vi.mock('@/components/ui/Table', () => ({
  Table: ({ data, columns }: { data: any[]; columns: any[] }) => (
    <table data-testid="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('ClientStatementTabs', () => {
  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      type: 'issued',
      status: 'paid',
      total: '1000.00',
      currency: 'RON',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      date: '2024-01-20',
      dueDate: '2024-02-20',
      type: 'received',
      status: 'draft',
      total: '500.00',
      currency: 'RON',
    },
  ];

  const mockPayments: Payment[] = [
    {
      id: 'pay-1',
      paymentNumber: 'PAY-001',
      date: '2024-01-10',
      type: 'income',
      status: 'completed',
      amount: '800.00',
      currency: 'RON',
      description: 'Payment received',
    },
    {
      id: 'pay-2',
      paymentNumber: 'PAY-002',
      date: '2024-01-12',
      type: 'expense',
      status: 'pending',
      amount: '300.00',
      currency: 'RON',
      description: 'Payment made',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with invoices tab active by default', () => {
    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('should switch to payments tab when clicked', () => {
    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    const paymentsTab = screen.getByText('Payments');
    fireEvent.click(paymentsTab);

    // After clicking payments tab, the table should still be visible
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('should call onInvoiceTypeFilterChange when invoice type filter changes', () => {
    const onInvoiceTypeFilterChange = vi.fn();

    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={onInvoiceTypeFilterChange}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    const invoiceTypeSelect = screen.getByLabelText('Invoice Type');
    fireEvent.change(invoiceTypeSelect, { target: { value: 'issued' } });

    expect(onInvoiceTypeFilterChange).toHaveBeenCalledWith('issued');
  });

  it('should call onInvoiceStatusFilterChange when invoice status filter changes', () => {
    const onInvoiceStatusFilterChange = vi.fn();

    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={onInvoiceStatusFilterChange}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    const invoiceStatusSelect = screen.getByLabelText('Status');
    fireEvent.change(invoiceStatusSelect, { target: { value: 'paid' } });

    expect(onInvoiceStatusFilterChange).toHaveBeenCalledWith('paid');
  });

  it('should call onPaymentTypeFilterChange when payment type filter changes', () => {
    const onPaymentTypeFilterChange = vi.fn();

    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={onPaymentTypeFilterChange}
      />
    );

    // Switch to payments tab first
    const paymentsTab = screen.getByText('Payments');
    fireEvent.click(paymentsTab);

    const paymentTypeSelect = screen.getByLabelText('Type');
    fireEvent.change(paymentTypeSelect, { target: { value: 'income' } });

    expect(onPaymentTypeFilterChange).toHaveBeenCalledWith('income');
  });

  it('should display invoice filters when invoices tab is active', () => {
    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Invoice Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('should display payment filter when payments tab is active', () => {
    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter=""
        invoiceStatusFilter=""
        paymentTypeFilter=""
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    // Switch to payments tab
    const paymentsTab = screen.getByText('Payments');
    fireEvent.click(paymentsTab);

    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });

  it('should render correct filter values', () => {
    render(
      <ClientStatementTabs
        invoices={mockInvoices}
        payments={mockPayments}
        invoiceTypeFilter="issued"
        invoiceStatusFilter="paid"
        paymentTypeFilter="income"
        onInvoiceTypeFilterChange={vi.fn()}
        onInvoiceStatusFilterChange={vi.fn()}
        onPaymentTypeFilterChange={vi.fn()}
      />
    );

    const invoiceTypeSelect = screen.getByLabelText('Invoice Type') as HTMLSelectElement;
    expect(invoiceTypeSelect.value).toBe('issued');

    const invoiceStatusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    expect(invoiceStatusSelect.value).toBe('paid');
  });
});

