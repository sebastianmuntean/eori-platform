'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { useNameDays, NameDay } from '@/hooks/useNameDays';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';

interface NameDaysPageContentProps {
  locale: string;
}

/**
 * Name Days page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function NameDaysPageContent({ locale }: NameDaysPageContentProps) {
  const t = useTranslations('common');

  const { nameDays, loading, error, fetchNameDays } = useNameDays();
  const { parishes, fetchParishes } = useParishes();

  const [parishFilter, setParishFilter] = useState('');
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const today = new Date();
    const dateTo = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    fetchNameDays({
      dateFrom: today.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      parishId: parishFilter || undefined,
      daysAhead,
    });
  }, [parishFilter, daysAhead, fetchNameDays]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale);
  };

  const columns = [
    {
      key: 'upcomingNameDay' as keyof NameDay,
      label: t('nameDay') || 'Name Day',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'firstName' as keyof NameDay,
      label: t('name') || 'Name',
      sortable: false,
      render: (_: any, row: any) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.code,
    },
    {
      key: 'daysUntil' as keyof NameDay,
      label: t('daysUntil') || 'Days Until',
      sortable: false,
    },
    {
      key: 'phone' as keyof NameDay,
      label: t('phone'),
      sortable: false,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
          { label: t('nameDays') || 'Name Days' },
        ]}
        title={t('nameDays') || 'Upcoming Name Days'}
      />

      <Card variant="outlined">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              value={parishFilter}
              onChange={(e) => setParishFilter(e.target.value)}
            >
              <option value="">{t('allParishes') || 'All Parishes'}</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              label={t('daysAhead') || 'Days Ahead'}
              value={daysAhead.toString()}
              onChange={(e) => setDaysAhead(parseInt(e.target.value) || 30)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading') || 'Loading...'}</div>
          ) : (
            <Table data={nameDays} columns={columns} />
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}

