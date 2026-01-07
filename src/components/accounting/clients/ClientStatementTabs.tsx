'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Invoice } from '@/hooks/useInvoices';
import { Payment } from '@/hooks/usePayments';
import { formatCurrency } from '@/lib/utils/accounting';
import { useTranslations } from 'next-intl';

// Constants - moved outside component to avoid recreation
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

type TabType = 'invoices' | 'payments';

interface ClientStatementTabsProps {
  invoices: Invoice[];
  payments: Payment[];
  invoiceTypeFilter: string;
  invoiceStatusFilter: string;
  paymentTypeFilter: string;
  onInvoiceTypeFilterChange: (value: string) => void;
  onInvoiceStatusFilterChange: (value: string) => void;
  onPaymentTypeFilterChange: (value: string) => void;
}

/**
 * Tabs component for client statement
 * Displays invoices and payments in separate tabs with filtering options
 */
export function ClientStatementTabs({
  invoices,
  payments,
  invoiceTypeFilter,
  invoiceStatusFilter,
  paymentTypeFilter,
  onInvoiceTypeFilterChange,
  onInvoiceStatusFilterChange,
  onPaymentTypeFilterChange,
}: ClientStatementTabsProps) {
  const t = useTranslations('common');
  const [activeTab, setActiveTab] = useState<TabType>('invoices');

  // Memoized table column definitions to avoid recreation on every render
  const invoiceColumns = useMemo<Column<Invoice>[]>(
    () => [
      { key: 'invoiceNumber', label: t('invoiceNumber'), sortable: true },
      { key: 'date', label: t('date'), sortable: true },
      { key: 'dueDate', label: t('dueDate'), sortable: false },
      {
        key: 'type',
        label: t('invoiceType'),
        sortable: false,
        render: (value: 'issued' | 'received') => (
          <Badge variant={value === 'issued' ? 'primary' : 'info'} size="sm">
            {value === 'issued' ? t('issued') : t('received')}
          </Badge>
        ),
      },
      {
        key: 'status',
        label: t('status'),
        sortable: false,
        render: (value: string) => (
          <Badge variant={INVOICE_STATUS_VARIANTS[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        ),
      },
      {
        key: 'total',
        label: t('total'),
        sortable: true,
        render: (value: string, row: Invoice) => formatCurrency(value, row.currency),
      },
    ],
    [t]
  );

  const paymentColumns = useMemo<Column<Payment>[]>(
    () => [
      { key: 'paymentNumber', label: t('paymentNumber'), sortable: true },
      { key: 'date', label: t('date'), sortable: true },
      {
        key: 'type',
        label: t('type'),
        sortable: false,
        render: (value: 'income' | 'expense') => (
          <Badge variant={value === 'income' ? 'success' : 'danger'} size="sm">
            {value === 'income' ? t('income') : t('expense')}
          </Badge>
        ),
      },
      {
        key: 'status',
        label: t('status'),
        sortable: false,
        render: (value: string) => (
          <Badge variant={PAYMENT_STATUS_VARIANTS[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        ),
      },
      {
        key: 'amount',
        label: t('amount'),
        sortable: true,
        render: (value: string, row: Payment) => formatCurrency(value, row.currency),
      },
      { key: 'description', label: t('description'), sortable: false },
    ],
    [t]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('invoices')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('payments')}
          </button>
        </div>
      </CardHeader>
      <CardBody>
        {activeTab === 'invoices' && (
          <div>
            <div className="flex gap-4 mb-4">
              <select
                value={invoiceTypeFilter}
                onChange={(e) => onInvoiceTypeFilterChange(e.target.value)}
                className="px-3 py-2 border rounded bg-background text-text-primary"
                aria-label={t('invoiceType')}
              >
                <option value="">{t('allTypes')}</option>
                <option value="issued">{t('issued')}</option>
                <option value="received">{t('received')}</option>
              </select>
              <select
                value={invoiceStatusFilter}
                onChange={(e) => onInvoiceStatusFilterChange(e.target.value)}
                className="px-3 py-2 border rounded bg-background text-text-primary"
                aria-label={t('status')}
              >
                <option value="">{t('allStatuses')}</option>
                <option value="draft">{t('draft')}</option>
                <option value="sent">{t('sent')}</option>
                <option value="paid">{t('paid')}</option>
                <option value="overdue">{t('overdue')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
            <Table data={invoices} columns={invoiceColumns} />
          </div>
        )}
        {activeTab === 'payments' && (
          <div>
            <div className="flex gap-4 mb-4">
              <select
                value={paymentTypeFilter}
                onChange={(e) => onPaymentTypeFilterChange(e.target.value)}
                className="px-3 py-2 border rounded bg-background text-text-primary"
                aria-label={t('type')}
              >
                <option value="">{t('allTypes')}</option>
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
            </div>
            <Table data={payments} columns={paymentColumns} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

