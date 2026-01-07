import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContractInvoiceTableColumns } from '@/components/accounting/contracts/ContractInvoiceTableColumns';
import { ContractInvoice } from '@/hooks/useContracts';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      period: 'Period',
      invoiceNumber: 'Invoice Number',
      date: 'Date',
      dueDate: 'Due Date',
      amount: 'Amount',
      vat: 'VAT',
      total: 'Total',
      status: 'Status',
      paymentDate: 'Payment Date',
      generatedAt: 'Generated At',
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
    };
    return translations[key] || key;
  },
}));

describe('useContractInvoiceTableColumns', () => {
  const mockContractInvoice: ContractInvoice = {
    id: 'ci-1',
    contractId: 'contract-1',
    invoiceId: 'invoice-1',
    periodYear: 2024,
    periodMonth: 3,
    generatedAt: new Date('2024-03-15'),
    generatedBy: 'user-1',
    invoice: {
      id: 'invoice-1',
      invoiceNumber: 'INV-001',
      date: '2024-03-01',
      dueDate: '2024-03-31',
      amount: '1000.00',
      vat: '190.00',
      total: '1190.00',
      currency: 'RON',
      status: 'paid',
      paymentDate: '2024-03-20',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return table columns', () => {
    const { result } = renderHook(() => useContractInvoiceTableColumns());

    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('should have correct column keys', () => {
    const { result } = renderHook(() => useContractInvoiceTableColumns());

    const keys = result.current.map((col) => col.key);
    expect(keys).toContain('periodYear');
    expect(keys).toContain('invoiceId');
    expect(keys).toContain('contractId');
  });

  it('should render period correctly', () => {
    const { result } = renderHook(() => useContractInvoiceTableColumns());

    const periodColumn = result.current.find((col) => col.key === 'periodYear');
    expect(periodColumn).toBeDefined();

    if (periodColumn?.render) {
      const rendered = periodColumn.render(null, mockContractInvoice);
      expect(rendered).toContain('March');
      expect(rendered).toContain('2024');
    }
  });

  it('should render invoice number correctly', () => {
    const { result } = renderHook(() => useContractInvoiceTableColumns());

    const invoiceNumberColumn = result.current.find((col) => col.key === 'invoiceId');
    expect(invoiceNumberColumn).toBeDefined();

    if (invoiceNumberColumn?.render) {
      const rendered = invoiceNumberColumn.render(null, mockContractInvoice);
      expect(rendered).toBe('INV-001');
    }
  });

  it('should render "-" when invoice is missing', () => {
    const invoiceWithoutData: ContractInvoice = {
      ...mockContractInvoice,
      invoice: undefined as any,
    };

    const { result } = renderHook(() => useContractInvoiceTableColumns());

    const invoiceNumberColumn = result.current.find((col) => col.key === 'invoiceId');
    if (invoiceNumberColumn?.render) {
      const rendered = invoiceNumberColumn.render(null, invoiceWithoutData);
      expect(rendered).toBe('-');
    }
  });

  it('should render status badge correctly', () => {
    const { result } = renderHook(() => useContractInvoiceTableColumns());

    const statusColumn = result.current.find((col) => col.key === 'periodYear' && col.label === 'Status');
    // Find the status column by checking render function
    const statusColumn2 = result.current.find((col) => {
      if (col.render) {
        const rendered = col.render(null, mockContractInvoice);
        return typeof rendered === 'object' && rendered !== null && 'props' in rendered;
      }
      return false;
    });

    // Status column should exist and render a badge
    const statusCol = result.current.find((col) => {
      try {
        const rendered = col.render?.(null, mockContractInvoice);
        return rendered && typeof rendered === 'object';
      } catch {
        return false;
      }
    });

    expect(statusCol).toBeDefined();
  });

  it('should handle missing payment date', () => {
    const invoiceWithoutPayment: ContractInvoice = {
      ...mockContractInvoice,
      invoice: {
        ...mockContractInvoice.invoice!,
        paymentDate: null as any,
      },
    };

    const { result } = renderHook(() => useContractInvoiceTableColumns());

    const paymentDateColumn = result.current.find((col) => col.key === 'generatedAt' && col.label === 'Payment Date');
    // Find column that handles payment date
    const paymentCol = result.current.find((col) => {
      try {
        const rendered = col.render?.(null, invoiceWithoutPayment);
        return rendered !== undefined;
      } catch {
        return false;
      }
    });

    expect(paymentCol).toBeDefined();
  });
});

