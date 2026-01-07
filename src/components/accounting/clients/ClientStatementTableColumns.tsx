'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Invoice } from '@/hooks/useInvoices';
import { Payment } from '@/hooks/usePayments';
import { formatCurrency } from '@/lib/utils/accounting';

// Constants
const INVOICE_STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
  draft: 'secondary',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'secondary',
};

const PAYMENT_STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

interface ClientStatementTableColumnsProps {
  t: (key: string) => string;
}

/**
 * Generates invoice columns for client statement
 * Extracted from page component for better separation of concerns
 */
export function getClientStatementInvoiceColumns({
  t,
}: ClientStatementTableColumnsProps): Column<Invoice>[] {
  return [
    { key: 'invoiceNumber' as keyof Invoice, label: t('invoiceNumber'), sortable: true },
    { key: 'date' as keyof Invoice, label: t('date'), sortable: true },
    { key: 'dueDate' as keyof Invoice, label: t('dueDate'), sortable: false },
    {
      key: 'type' as keyof Invoice,
      label: t('invoiceType'),
      sortable: false,
      render: (value: 'issued' | 'received') => (
        <Badge variant={value === 'issued' ? 'primary' : 'info'} size="sm">
          {value === 'issued' ? t('issued') : t('received')}
        </Badge>
      ),
    },
    {
      key: 'status' as keyof Invoice,
      label: t('status'),
      sortable: false,
      render: (value: string) => (
        <Badge variant={INVOICE_STATUS_VARIANTS[value] || 'secondary'} size="sm">
          {t(value)}
        </Badge>
      ),
    },
    {
      key: 'total' as keyof Invoice,
      label: t('total'),
      sortable: true,
      render: (value: string, row: Invoice) => formatCurrency(value, row.currency),
    },
  ];
}

/**
 * Generates payment columns for client statement
 * Extracted from page component for better separation of concerns
 */
export function getClientStatementPaymentColumns({
  t,
}: ClientStatementTableColumnsProps): Column<Payment>[] {
  return [
    { key: 'paymentNumber' as keyof Payment, label: t('paymentNumber'), sortable: true },
    { key: 'date' as keyof Payment, label: t('date'), sortable: true },
    {
      key: 'type' as keyof Payment,
      label: t('type'),
      sortable: false,
      render: (value: 'income' | 'expense') => (
        <Badge variant={value === 'income' ? 'success' : 'danger'} size="sm">
          {value === 'income' ? t('income') : t('expense')}
        </Badge>
      ),
    },
    {
      key: 'status' as keyof Payment,
      label: t('status'),
      sortable: false,
      render: (value: string) => (
        <Badge variant={PAYMENT_STATUS_VARIANTS[value] || 'secondary'} size="sm">
          {t(value)}
        </Badge>
      ),
    },
    {
      key: 'amount' as keyof Payment,
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Payment) => formatCurrency(value, row.currency),
    },
    { key: 'description' as keyof Payment, label: t('description'), sortable: false },
  ];
}

