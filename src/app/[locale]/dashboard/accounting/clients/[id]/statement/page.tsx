'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useClientStatement } from '@/hooks/useClientStatement';
import { Invoice } from '@/hooks/useInvoices';
import { Payment } from '@/hooks/usePayments';
import { useTranslations } from 'next-intl';

export default function ClientStatementPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const clientId = params.id as string;
  const t = useTranslations('common');

  const { statement, loading, error, fetchStatement } = useClientStatement();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'statement'>('invoices');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');

  useEffect(() => {
    if (clientId) {
      fetchStatement({
        clientId: clientId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        invoiceType: invoiceTypeFilter ? (invoiceTypeFilter as 'issued' | 'received') : undefined,
        invoiceStatus: invoiceStatusFilter ? (invoiceStatusFilter as any) : undefined,
        paymentType: paymentTypeFilter ? (paymentTypeFilter as 'income' | 'expense') : undefined,
      });
    }
  }, [clientId, dateFrom, dateTo, invoiceTypeFilter, invoiceStatusFilter, paymentTypeFilter, fetchStatement]);

  const formatCurrency = (amount: number | string, currency: string = 'RON') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(num);
  };

  const getPartnerDisplayName = () => {
    if (!statement?.partner) return '';
    const partner = statement.partner;
    if (partner.type === 'company' && partner.companyName) {
      return partner.companyName;
    }
    return `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || partner.code;
  };

  const invoiceColumns = [
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
      render: (value: string) => {
        const variantMap: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
          draft: 'secondary',
          sent: 'info',
          paid: 'success',
          overdue: 'danger',
          cancelled: 'secondary',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'total',
      label: t('total'),
      sortable: true,
      render: (value: string, row: Invoice) => formatCurrency(value, row.currency),
    },
  ];

  const paymentColumns = [
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
      render: (value: string) => {
        const variantMap: Record<string, 'warning' | 'success' | 'danger'> = {
          pending: 'warning',
          completed: 'success',
          cancelled: 'danger',
        };
        return (
          <Badge variant={variantMap[value] || 'secondary'} size="sm">
            {t(value)}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Payment) => formatCurrency(value, row.currency),
    },
    { key: 'description', label: t('description'), sortable: false },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
    { label: t('clients'), href: `/${locale}/dashboard/accounting/clients` },
    { label: t('clientStatement') },
  ];

  if (loading && !statement) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <div>Loading...</div>
      </div>
    );
  }

  if (error && !statement) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
        <div>{t('clientNotFound') || 'Client not found'}</div>
      </div>
    );
  }

  const { partner, summary, invoices, payments } = statement;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{t('clientStatement')}</h1>
          <p className="text-text-secondary mt-1">{getPartnerDisplayName()}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/accounting/clients`)}>
          {t('back')} {t('toClients')}
        </Button>
      </div>

      {/* Client Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('clientInformation')}</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('code')}</p>
              <p className="font-medium">{partner.code}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('category')}</p>
              <Badge variant="secondary" size="sm">
                {t(`category_${partner.category}`) || partner.category}
              </Badge>
            </div>
            {partner.phone && (
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('phone')}</p>
                <p className="font-medium">{partner.phone}</p>
              </div>
            )}
            {partner.email && (
              <div>
                <p className="text-sm text-text-secondary mb-1">{t('email')}</p>
                <p className="font-medium">{partner.email}</p>
              </div>
            )}
            {partner.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-text-secondary mb-1">{t('address')}</p>
                <p className="font-medium">{partner.address}</p>
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
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('dateTo')}</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              >
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
              <p className="text-xs text-text-secondary mt-1">{summary.issuedInvoicesCount} {t('invoices')}</p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('receivedInvoices')}</p>
              <p className="text-2xl font-bold text-info">{formatCurrency(summary.receivedInvoices)}</p>
              <p className="text-xs text-text-secondary mt-1">{summary.receivedInvoicesCount} {t('invoices')}</p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('paymentsReceived')}</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(summary.paymentsReceived)}</p>
              <p className="text-xs text-text-secondary mt-1">{summary.paymentsReceivedCount} {t('payments')}</p>
            </div>
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <div>
              <p className="text-sm text-text-secondary mb-1">{t('paymentsMade')}</p>
              <p className="text-2xl font-bold text-danger">{formatCurrency(summary.paymentsMade)}</p>
              <p className="text-xs text-text-secondary mt-1">{summary.paymentsMadeCount} {t('payments')}</p>
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
                  className="px-3 py-2 border rounded"
                >
                  <option value="">{t('allTypes')}</option>
                  <option value="issued">{t('issued')}</option>
                  <option value="received">{t('received')}</option>
                </select>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="">{t('allStatuses')}</option>
                  <option value="draft">{t('draft')}</option>
                  <option value="sent">{t('sent')}</option>
                  <option value="paid">{t('paid')}</option>
                  <option value="overdue">{t('overdue')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>
              <Table data={invoices} columns={invoiceColumns} loading={loading} />
            </div>
          )}
          {activeTab === 'payments' && (
            <div>
              <div className="flex gap-4 mb-4">
                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="">{t('allTypes')}</option>
                  <option value="income">{t('income')}</option>
                  <option value="expense">{t('expense')}</option>
                </select>
              </div>
              <Table data={payments} columns={paymentColumns} loading={loading} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

