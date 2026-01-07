'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClientStatement } from '@/hooks/useClientStatement';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getClientDisplayName } from '@/lib/utils/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { ClientStatementSummaryCards } from './ClientStatementSummaryCards';
import { ClientStatementTabs } from './ClientStatementTabs';

interface ClientStatementPageContentProps {
  locale: string;
  clientId: string;
}

/**
 * Client Statement page content component
 * Contains all the JSX/HTML and business logic that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function ClientStatementPageContent({ locale, clientId }: ClientStatementPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');

  // State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  // Update page title when client data is loaded
  usePageTitle(clientDisplayName ? `${t('statement')} - ${clientDisplayName}` : `${t('statement')} - EORI`);

  // Validate date range before fetching
  const isValidDateRange = useMemo(() => {
    if (!dateFrom || !dateTo) return true; // Empty dates are valid (no filter)
    return new Date(dateFrom) <= new Date(dateTo);
  }, [dateFrom, dateTo]);

  // Fetch statement when filters change
  useEffect(() => {
    if (!clientId || !isValidDateRange) return;

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
  }, [clientId, dateFrom, dateTo, invoiceTypeFilter, invoiceStatusFilter, paymentTypeFilter, isValidDateRange, fetchStatement]);

  // Clear date filters
  const handleClearDates = useCallback(() => {
    setDateFrom('');
    setDateTo('');
  }, []);

  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: t('accounting'), href: `/${locale}/dashboard/accounting` },
      { label: t('clients'), href: `/${locale}/dashboard/accounting/clients` },
      { label: t('clientStatement') },
    ],
    [locale, t]
  );

  if (loading && !statement) {
    return (
      <PageContainer>
        <PageHeader breadcrumbs={breadcrumbs} title={t('clientStatement')} />
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  if (error && !statement) {
    return (
      <PageContainer>
        <PageHeader breadcrumbs={breadcrumbs} title={t('clientStatement')} />
        <div className="text-red-500">{error}</div>
      </PageContainer>
    );
  }

  if (!statement) {
    return (
      <PageContainer>
        <PageHeader breadcrumbs={breadcrumbs} title={t('clientStatement')} />
        <div>{t('clientNotFound') || 'Client not found'}</div>
      </PageContainer>
    );
  }

  const { client, summary, invoices, payments } = statement;

  return (
    <PageContainer>
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
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('dateTo')}</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearDates}>
                {t('clear')}
              </Button>
            </div>
          </div>
          {!isValidDateRange && (
            <p className="text-sm text-red-500 mt-2">
              {t('dateRangeInvalid') || 'Date range is invalid. From date must be before or equal to To date.'}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <ClientStatementSummaryCards summary={summary} />

      {/* Tabs */}
      <ClientStatementTabs
        invoices={invoices}
        payments={payments}
        invoiceTypeFilter={invoiceTypeFilter}
        invoiceStatusFilter={invoiceStatusFilter}
        paymentTypeFilter={paymentTypeFilter}
        onInvoiceTypeFilterChange={setInvoiceTypeFilter}
        onInvoiceStatusFilterChange={setInvoiceStatusFilter}
        onPaymentTypeFilterChange={setPaymentTypeFilter}
      />
    </PageContainer>
  );
}

