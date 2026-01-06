'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { useBirthdays } from '@/hooks/useBirthdays';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

export default function BirthdaysPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.BIRTHDAYS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('birthdays'));

  // All hooks must be called before any conditional returns
  const { birthdays, loading, error, fetchBirthdays } = useBirthdays();
  const { parishes, fetchParishes } = useParishes();

  const [parishFilter, setParishFilter] = useState('');
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    if (permissionLoading) return;
    fetchParishes({ all: true });
  }, [permissionLoading, fetchParishes]);

  useEffect(() => {
    if (permissionLoading) return;
    const today = new Date();
    const dateTo = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    fetchBirthdays({
      dateFrom: today.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      parishId: parishFilter || undefined,
      daysAhead,
    });
  }, [permissionLoading, parishFilter, daysAhead, fetchBirthdays]);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString(locale);
  }, [locale]);

  const columns = useMemo(() => [
    {
      key: 'upcomingBirthday' as const,
      label: t('birthday') || 'Birthday',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'firstName' as const,
      label: t('name') || 'Name',
      sortable: false,
      render: (_: unknown, row: any) => 
        `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.code || '',
    },
    {
      key: 'age' as const,
      label: t('age') || 'Age',
      sortable: false,
    },
    {
      key: 'daysUntil' as const,
      label: t('daysUntil') || 'Days Until',
      sortable: false,
    },
    {
      key: 'phone' as const,
      label: t('phone'),
      sortable: false,
    },
  ], [t, formatDate]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('parishioners') || 'Parishioners', href: `/${locale}/dashboard/parishioners` },
          { label: t('birthdays') || 'Birthdays' },
        ]}
        title={t('birthdays') || 'Upcoming Birthdays'}
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
            <Table data={birthdays} columns={columns} />
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}


