'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useClientStatement } from '@/hooks/useClientStatement';
import { Invoice } from '@/hooks/useInvoices';
import { Payment } from '@/hooks/usePayments';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { formatCurrency, getClientDisplayName } from '@/lib/utils/accounting';

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

type TabType = 'invoices' | 'payments';

export default function ClientStatementPage() {
  // Hooks - authentication and routing
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_VIEW_STATEMENT);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const clientId = params.id as string;
  const t = useTranslations('common');

  // State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');

  // Data fetching
  const { statement, loading, error, fetchStatement } = useClientStatement();

  // Memoized client display name for page title
  const clientDisplayName = useMemo(
    () => (statement?.client ? getClientDisplayName(statement.client) : ''),
    [statement?.client]
  );

  // Page title
  usePageTitle(clientDisplayName ? `${t('statement')} - ${clientDisplayName}` : `${t('statement')} - EORI`);

  // Fetch statement when filters change
  useEffect(() => {
    if (!clientId) return;

    fetchStatement({
      clientId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      invoiceType: invoiceTypeFilter ? (invoiceTypeFilter as 'issued' | 'received') : undefined,
      invoiceStatus: invoiceStatusFilter
        ? (invoiceStatusFilter as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')
        : undefined,
      paymentType: paymentTypeFilter ? (paymentTypeFilter as 'income' | 'expense') : undefined,
    });
  }, [clientId, dateFrom, dateTo, invoiceTypeFilter, invoiceStatusFilter, paymentTypeFilter, fetchStatement]);

  // Clear date filters
  const handleClearDates = useCallback(() => {
    setDateFrom('');
    setDateTo('');
  }, []);

  // Memoized table column definitions
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

  // Early returns for loading and errors
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
    { label: t('clients'), href: `/${locale}/dashboard/accounting/clients` },
    { label: t('clientStatement') },
  ];

  if (loading && !statement) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={breadcrumbs} title={t('clientStatement')} />
        <div>{t('loading')}</div>
      </div>
    );
  }

  if (error && !statement) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={breadcrumbs} title={t('clientStatement')} />
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={breadcrumbs} title={t('clientStatement')} />
        <div>{t('clientNotFound') || 'Client not found'}</div>
      </div>
    );
  }

  const { client, summary, invoices, payments } = statement;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('clientStatement')}
        description={client ? getClientDisplayName(client) : undefined}
        action={
          <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/accounting/clients`)}>
            {t('back')} {t('toClients')}
          </Button>
        }
      />

      {/* Client Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('clientInformation')}</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('code')}</p>
              <p className="font-medium">{client.code}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('phone')}</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            )}
            {client.email && (
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('email')}</p>
                <p className="font-medium">{client.email}</p>
              </div>
            )}
            {client.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-text-secondary mb-1">{t('address')}</p>
                <p className="font-medium">{client.address}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('dateFrom')}</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('dateTo')}</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearDates}>
                {t('clear')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('issuedInvoices')}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(summary.issuedInvoices)}</p>
              <p className="text-xs text-text-secondary mt-1">
                {summary.issuedInvoicesCount} {t('invoices')}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('receivedInvoices')}</p>
              <p className="text-2xl font-bold text-info">{formatCurrency(summary.receivedInvoices)}</p>
              <p className="text-xs text-text-secondary mt-1">
                {summary.receivedInvoicesCount} {t('invoices')}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('paymentsReceived')}</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(summary.paymentsReceived)}</p>
              <p className="text-xs text-text-secondary mt-1">
                {summary.paymentsReceivedCount} {t('payments')}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('paymentsMade')}</p>
              <p className="text-2xl font-bold text-danger">{formatCurrency(summary.paymentsMade)}</p>
              <p className="text-xs text-text-secondary mt-1">
                {summary.paymentsMadeCount} {t('payments')}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated" className="border-2 border-primary">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('finalBalance')}</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(summary.balance)}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {summary.balance >= 0 ? t('clientOwes') : t('weOwe')}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
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
                  onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded bg-background text-text-primary"
                  aria-label={t('invoiceType')}
                >
                  <option value="">{t('allTypes')}</option>
                  <option value="issued">{t('issued')}</option>
                  <option value="received">{t('received')}</option>
                </select>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
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
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
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
    </div>
  );
}